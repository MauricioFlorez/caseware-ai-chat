# Retry mechanism issue in chat feature
_Exported on 2/23/2026 at 15:23:15 GMT-5 from Cursor (2.5.20)_

---

**User**

Verify this issue exists and fix it:

`onRetry` sets `retryCountForNextError` to the incremented value (e.g. 1), then immediately calls `onSendMessage`, which unconditionally resets `retryCountForNextError` back to 0. When the subsequent request fails, the error panel is created with `retryCount: 0` every time. The count never reaches `ERROR_PANEL_MAX_RETRIES` (2), so the "We are experiencing issues, try in some minutes." message is unreachable and the Retry button is never hidden — completely breaking the FR-004/FR-019 retry limit feature. @frontend/src/app/features/chat/chat-shell.component.ts:195-204 @frontend/src/app/features/chat/chat-shell.component.ts:116-117 

---

**Cursor**


Reading the chat-shell component to verify the retry-count bug and fix it.



Confirming the bug: `onRetry` sets `retryCountForNextError` to the incremented value (line 199), then calls `onSendMessage(text)` (line 203), and `onSendMessage` unconditionally resets it to 0 (line 115), so the error panel always gets `retryCount: 0`. Fixing by only resetting `retryCountForNextError` when the send is not a retry.



Summary of what was wrong and what was changed:

**Bug**
- `onRetry()` set `retryCountForNextError` to `(panel?.retryCount ?? 0) + 1`, then called `onSendMessage(text)`.
- `onSendMessage()` always did `this.retryCountForNextError.set(0)` at the start.
- So after each Retry the count was reset to 0 before the request ran, and the next error always showed `retryCount: 0`. The count never reached `ERROR_PANEL_MAX_RETRIES` (2), so the “We are experiencing issues, try in some minutes.” state and hiding the Retry button never happened.

**Fix**
1. **`onSendMessage(text: string, isRetry = false)`**  
   - Only reset the retry count when it’s not a retry:  
     `if (!isRetry) this.retryCountForNextError.set(0);`
2. **`onRetry()`**  
   - Call the send with the retry flag:  
     `this.onSendMessage(text, true);`

Resulting behavior:
- First failure → error panel with `retryCount: 0` (Retry shown).
- Retry 1 fails → `retryCount: 1` (Retry still shown).
- Retry 2 fails → `retryCount: 2` → `retryCount >= ERROR_PANEL_MAX_RETRIES` → “We are experiencing issues, try in some minutes.” and Retry is hidden (FR-004/FR-019).

Existing template calls `onSendMessage($event)` with one argument, so they keep using `isRetry = false` and behavior for new messages is unchanged.

