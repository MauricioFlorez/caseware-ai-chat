import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SseStreamService } from './sse-stream.service';
import { ConnectionStateService } from './connection-state.service';

describe('SseStreamService', () => {
  let service: SseStreamService;
  let connectionState: ConnectionStateService;
  let setModeSpy: jasmine.Spy;
  let setActiveStreamSpy: jasmine.Spy;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    TestBed.configureTestingModule({
      providers: [SseStreamService, ConnectionStateService],
    });
    connectionState = TestBed.inject(ConnectionStateService);
    setModeSpy = spyOn(connectionState, 'setMode').and.callThrough();
    setActiveStreamSpy = spyOn(connectionState, 'setActiveStream').and.callThrough();
    service = TestBed.inject(SseStreamService);
  });

  afterEach(() => {
    (globalThis as unknown as { fetch: typeof fetch }).fetch = originalFetch;
  });

  it('should set disconnected and emit one error when response.ok is false', (done) => {
    (globalThis as unknown as { fetch: typeof fetch }).fetch = () =>
      Promise.resolve({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        body: null,
      } as Response);

    const events: unknown[] = [];
    service.events.subscribe((e) => {
      events.push(e);
      if (events.length >= 1) {
        expect(connectionState.mode()).toBe('disconnected');
        expect(setActiveStreamSpy).toHaveBeenCalledWith(false);
        expect(events).toEqual([
          { type: 'error', message: 'Request failed: 400 Bad Request' },
        ]);
        done();
      }
    });

    service.send('hello');
  });

  it('should set disconnected and emit one error when fetch rejects (network error)', fakeAsync(() => {
    (globalThis as unknown as { fetch: typeof fetch }).fetch = () =>
      Promise.reject(new Error('Network error'));

    const events: unknown[] = [];
    service.events.subscribe((e) => events.push(e));

    service.send('hello');
    // Retries: attempt 1 fails -> 2s -> attempt 2 -> 2s -> attempt 3 -> 2s -> attempt 4 fails -> emit error
    tick(2000);
    tick(2000);
    tick(2000);
    tick(100);

    expect(connectionState.mode()).toBe('disconnected');
    expect(setActiveStreamSpy).toHaveBeenCalledWith(false);
    expect(events).toEqual([{ type: 'error', message: 'Network error' }]);
  }));

  it('should NOT emit error when fetch rejects with AbortError', (done) => {
    const abortError = new Error('Aborted');
    (abortError as Error & { name: string }).name = 'AbortError';
    (globalThis as unknown as { fetch: typeof fetch }).fetch = () =>
      Promise.reject(abortError);

    const events: unknown[] = [];
    service.events.subscribe((e) => events.push(e));

    service.send('hello');

    setTimeout(() => {
      expect(events).toEqual([]);
      done();
    }, 100);
  });

  it('should set disconnected and emit one error when reader.read() throws (not AbortError)', (done) => {
    const reader = {
      read: jasmine.createSpy('read').and.returnValue(Promise.reject(new Error('Read failed'))),
      releaseLock: jasmine.createSpy('releaseLock'),
    };
    (globalThis as unknown as { fetch: typeof fetch }).fetch = () =>
      Promise.resolve({
        ok: true,
        status: 200,
        body: { getReader: () => reader } as unknown as ReadableStream<Uint8Array>,
      } as Response);

    const events: unknown[] = [];
    service.events.subscribe((e) => {
      events.push(e);
      if (events.length >= 1) {
        expect(connectionState.mode()).toBe('disconnected');
        expect(setActiveStreamSpy).toHaveBeenCalledWith(false);
        expect(events).toEqual([{ type: 'error', message: 'Read failed' }]);
        done();
      }
    });

    service.send('hello');
  });

  it('should NOT emit error when reader.read() throws AbortError', (done) => {
    const abortError = new Error('Aborted');
    (abortError as Error & { name: string }).name = 'AbortError';
    const reader = {
      read: jasmine.createSpy('read').and.returnValue(Promise.reject(abortError)),
      releaseLock: jasmine.createSpy('releaseLock'),
    };
    (globalThis as unknown as { fetch: typeof fetch }).fetch = () =>
      Promise.resolve({
        ok: true,
        status: 200,
        body: { getReader: () => reader } as unknown as ReadableStream<Uint8Array>,
      } as Response);

    const events: unknown[] = [];
    service.events.subscribe((e) => events.push(e));

    service.send('hello');

    setTimeout(() => {
      expect(events).toEqual([]);
      done();
    }, 100);
  });
});
