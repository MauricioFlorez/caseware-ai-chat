import { Subject } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { ChatShellComponent } from './chat-shell.component';
import { ConnectionStateService } from '../../core/connection-state.service';
import { DataSourceService } from '../../core/data-source.service';
import { SseStreamService } from '../../core/sse-stream.service';
import { MockStreamService } from '../../core/mock-stream.service';
import type { StreamEvent } from '@caseware-ai-chat/shared';

/** Fake StreamSource for testing: controlled via eventsSubject, send/cancel are spies. */
function createFakeStream(): {
  eventsSubject: Subject<StreamEvent>;
  send: jasmine.Spy;
  cancel: jasmine.Spy;
  events: ReturnType<Subject<StreamEvent>['asObservable']>;
} {
  const eventsSubject = new Subject<StreamEvent>();
  const send = jasmine.createSpy('send');
  const cancel = jasmine.createSpy('cancel');
  return {
    eventsSubject,
    send,
    cancel,
    get events() {
      return eventsSubject.asObservable();
    },
  };
}

describe('ChatShellComponent', () => {
  let fakeStream: ReturnType<typeof createFakeStream>;
  let dataSource: DataSourceService;

  beforeEach(async () => {
    fakeStream = createFakeStream();
    await TestBed.configureTestingModule({
      imports: [ChatShellComponent],
      providers: [
        ConnectionStateService,
        DataSourceService,
        MockStreamService,
        { provide: SseStreamService, useValue: fakeStream },
      ],
    }).compileComponents();

    dataSource = TestBed.inject(DataSourceService);
    dataSource.setDataSource('live'); // use our fake as the stream
  });

  it('should append agent message content incrementally when multiple delta events arrive', () => {
    const fixture = TestBed.createComponent(ChatShellComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    comp.onSendMessage('Hello');
    expect(comp.messages().length).toBe(2); // user + agent
    expect(comp.messages()[1].content).toBe('');
    expect(comp.messages()[1].streamState).toBe('in_progress');

    fakeStream.eventsSubject.next({ type: 'delta', text: 'One ' });
    fakeStream.eventsSubject.next({ type: 'delta', text: 'two ' });
    fakeStream.eventsSubject.next({ type: 'delta', text: 'three.' });

    expect(comp.messages()[1].content).toBe('One two three.');
    expect(comp.messages()[1].streamState).toBe('in_progress');

    fakeStream.eventsSubject.next({ type: 'done' });
    expect(comp.messages()[1].streamState).toBe('done');
  });

  it('should set last message to error state and show error panel when stream emits error', () => {
    const fixture = TestBed.createComponent(ChatShellComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    comp.onSendMessage('Hello');
    expect(comp.messages().length).toBe(2);

    fakeStream.eventsSubject.next({ type: 'error', message: 'Something broke' });

    const last = comp.messages()[1];
    expect(last.streamState).toBe('error');
    expect(last.errorInfo).toBe('Something broke');
    expect(comp.errorPanel()).not.toBeNull();
    expect(comp.errorPanel()?.userMessageId).toBe(comp.messages()[0].id);
    expect(comp.errorPanel()?.message).toBe('Something broke');
    expect(comp.retryDisabled()).toBe(false);
  });

  it('should call stream.send with lastSentTextForRetry and set retryDisabled true until next done/error when onRetry() is called', () => {
    const fixture = TestBed.createComponent(ChatShellComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    comp.onSendMessage('Hello');
    fakeStream.eventsSubject.next({ type: 'error', message: 'Fail' });
    expect(comp.retryDisabled()).toBe(false);
    expect(comp.lastSentTextForRetry()).toBe('Hello');

    comp.onRetry();
    expect(fakeStream.send).toHaveBeenCalledWith('Hello');
    expect(comp.retryDisabled()).toBe(true);

    // Next done clears retryDisabled
    fakeStream.eventsSubject.next({ type: 'done' });
    expect(comp.retryDisabled()).toBe(false);
  });

  it('should show recoverable state after interrupted stream (retry works)', () => {
    const fixture = TestBed.createComponent(ChatShellComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    comp.onSendMessage('Ask');
    fakeStream.eventsSubject.next({ type: 'delta', text: 'partial ' });
    fakeStream.eventsSubject.next({ type: 'error', message: 'Connection lost' });

    expect(comp.messages()[1].streamState).toBe('error');
    expect(comp.messages()[1].content).toBe('partial ');
    expect(comp.errorPanel()).not.toBeNull();
    expect(comp.retryDisabled()).toBe(false);

    fakeStream.send.calls.reset();
    comp.onRetry();
    expect(fakeStream.send).toHaveBeenCalledWith('Ask');
    expect(comp.retryDisabled()).toBe(true);
  });
});
