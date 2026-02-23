import { TestBed } from '@angular/core/testing';
import { ErrorPanelComponent } from './error-panel.component';

describe('ErrorPanelComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorPanelComponent],
    }).compileComponents();
  });

  it('should show the message and disable Retry button when retryDisabled is true', () => {
    const fixture = TestBed.createComponent(ErrorPanelComponent);
    fixture.componentRef.setInput('message', 'Connection failed');
    fixture.componentRef.setInput('retryDisabled', true);
    fixture.componentRef.setInput('retryCount', 0);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const messageEl = el.querySelector('.error-panel__message');
    const retryBtn = el.querySelector('.error-panel__retry') as HTMLButtonElement | null;

    expect(messageEl?.textContent?.trim()).toBe('Connection failed');
    expect(retryBtn).toBeTruthy();
    expect(retryBtn?.disabled).toBe(true);
  });

  it('should show the message and enable Retry button when retryDisabled is false', () => {
    const fixture = TestBed.createComponent(ErrorPanelComponent);
    fixture.componentRef.setInput('message', 'Something broke');
    fixture.componentRef.setInput('retryDisabled', false);
    fixture.componentRef.setInput('retryCount', 0);
    fixture.detectChanges();

    const retryBtn = fixture.nativeElement.querySelector('.error-panel__retry') as HTMLButtonElement | null;
    expect(retryBtn?.disabled).toBe(false);
  });

  it('should emit retry when Retry button is clicked and not disabled', () => {
    const fixture = TestBed.createComponent(ErrorPanelComponent);
    fixture.componentRef.setInput('message', 'Error');
    fixture.componentRef.setInput('retryDisabled', false);
    fixture.componentRef.setInput('retryCount', 0);
    fixture.detectChanges();

    let emitted = false;
    fixture.componentInstance.retry.subscribe(() => (emitted = true));

    const retryBtn = fixture.nativeElement.querySelector('.error-panel__retry') as HTMLButtonElement | null;
    retryBtn?.click();
    fixture.detectChanges();

    expect(emitted).toBe(true);
  });

  it('should show alternate message and hide Retry button when retryCount >= 2', () => {
    const fixture = TestBed.createComponent(ErrorPanelComponent);
    fixture.componentRef.setInput('message', 'First error message');
    fixture.componentRef.setInput('retryDisabled', false);
    fixture.componentRef.setInput('retryCount', 2);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const messageEl = el.querySelector('.error-panel__message');
    const retryBtn = el.querySelector('.error-panel__retry');

    expect(messageEl?.textContent?.trim()).toBe(
      'Oops! We hit a snag. Give it a moment, refresh and try again.'
    );
    expect(retryBtn).toBeFalsy();
  });
});
