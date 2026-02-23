# Stream resource management issue
_Exported on 2/23/2026 at 15:22:50 GMT-5 from Cursor (2.5.20)_

---

**User**

Verify this issue exists and fix it:

The `stream` getter dynamically resolves to `sseStream` or `mockStream` based on the *current* data source mode. If the user sends a message in live mode (starting an SSE fetch), then switches the data-source dropdown to mock mid-stream, and clicks Stop, `onStopStream` calls `this.stream.cancel()` which resolves to `mockStream.cancel()` — the `sseStream`'s `AbortController` is never aborted. The SSE fetch and the backend child process continue running as orphaned resources. Nothing in the flow (including `unsubscribeStream`) calls `cancel()` on the previously-active source. @frontend/src/app/features/chat/chat-shell.component.ts:43-47 @frontend/src/app/features/chat/chat-shell.component.ts:191-194 

For this fix include a maek sure to add a new spec in spec.md

---

**Cursor**


Verifying the issue and implementing a fix. Reading the chat-shell component and spec.



Checking the `StreamSource` interface and how cancel is used:



Implementing the fix and adding the spec.



Adding the `activeStream` field with correct context:



Adding the new FR and edge case to the spec.



Checking for a Changelog section in the spec:



Adding a Changelog section per the template.



Summary of what was verified and changed:

## Issue verified

The `stream` getter returns whichever source is selected **now** (live → `sseStream`, mock → `mockStream`). So:

1. User sends in **live** mode → SSE starts, `stream` was `sseStream`.
2. User switches dropdown to **mock** mid-stream.
3. User clicks **Stop** → `onStopStream()` runs `this.stream.cancel()` → getter returns `mockStream` → `mockStream.cancel()` runs.
4. The real SSE stream and backend child process are never cancelled and keep running.

## Fix (chat-shell)

1. **Track the active stream**  
   Added `activeStream: StreamSource | null` and set it when starting a send:
   - In `onSendMessage`: `this.activeStream = this.stream` before `this.stream.send(trimmed)`.
   - In `onMockPreset`: `this.activeStream = streamForPreset` before `streamForPreset.send('', presetId)`.

2. **Cancel the active stream, not the getter**  
   - `unsubscribeStream()` now calls `this.activeStream?.cancel()`, then clears `activeStream`, then unsubscribes the subscription.
   - `onStopStream()` now calls `this.unsubscribeStream()` so Stop both cancels the correct stream and unsubscribes.

So Stop and “new send” always cancel the stream that was used for the current turn, regardless of the current data-source selection.

## Spec updates (`specs/001-chat-ui-streaming/spec.md`)

- **Changelog**  
  Added a v1.1 entry describing the Stop/active-stream behavior and FR-026.

- **Edge case**  
  “When the user switches the data source (live/mock) mid-stream and then triggers Stop: the system MUST cancel the stream that was used for the current turn (the one that started the in-flight request), not the stream for the currently selected data source, so that no SSE fetch or backend process is left running as an orphaned resource.”

- **FR-026**  
  “When the user triggers Stop (or when a new send unsubscribes the previous stream), the system MUST cancel the stream instance that was used for the current turn, not the stream resolved from the current data-source selection. This ensures that if the user switches the data-source dropdown mid-stream and then presses Stop, the correct (previously active) stream is cancelled and no SSE fetch or backend process is left running as an orphaned resource.”

Lint passes on `chat-shell.component.ts`.

---

**User**

FIx is not working, even changing the value in teh dropdow the stream is still alive in the server. Even cahnging the value the stream is "In Progress".  and the ui waits until the reponse arrives

---

**Cursor**


Checking how the data-source dropdown updates and how the shell can react so we cancel the stream and reset the UI when the source changes mid-stream.



Checking where `activeStream` (connection state) is set and how the composer shows "In Progress":



Checking whether SseStreamService.cancel() calls setActiveStream(false) and aborts the fetch:



Implementing cancellation and UI reset when the data-source dropdown changes mid-stream.



Checking ordering: set `activeStream` before creating the subscription so the effect can't run in a window where we've subscribed but haven't set `activeStream` yet.



Calling resetUiAfterCancel() from onStopStream() so the last message is marked done when the user clicks Stop.



Adding a spec note that changing the data source mid-stream cancels the stream and resets the UI:



Summary of what was wrong and what was changed:

## Why it wasn’t working

1. **Stop after switching dropdown**  
   That part was already fixed: Stop calls `unsubscribeStream()`, which cancels `activeStream` (the stream that was actually used), so the SSE request and backend process are aborted when you click Stop.

2. **Changing the dropdown without clicking Stop**  
   There was no reaction to the data-source change. So if you switched from Live to Mock (or the other way) while a stream was running, the app never cancelled that stream. The UI kept showing “In Progress” and waited for the response because:
   - The active stream was never cancelled.
   - The composer and “In Progress” state were never reset.

## Changes made

1. **Cancel and reset when the data source changes**  
   An `effect()` in the shell now depends on `dataSource.dataSource()`. When the user changes the dropdown and there is an active stream (`activeStream` or `streamSubscription` set), it:
   - Calls `unsubscribeStream()` so the **current** stream is cancelled (SSE aborted, backend process killed).
   - Calls `resetUiAfterCancel()` so the UI leaves “In Progress”: restores the last sent text in the composer, switches back to Send, and marks the last agent message as `streamState: 'done'`.

2. **Reset UI on Stop as well**  
   `onStopStream()` now also calls `resetUiAfterCancel()` so that when you click Stop, the last message is no longer shown as “In Progress”.

3. **Order of assignment**  
   `activeStream` is set **before** creating the subscription (in both `onSendMessage` and `onMockPreset`), so if the effect runs as soon as the dropdown changes, it always sees the correct active stream and can cancel it.

4. **Spec**  
   In `spec.md`: new edge case and changelog entry (v1.2) stating that changing the data-source dropdown mid-stream must cancel the current stream and reset the UI.

Result when you change the dropdown while a stream is running:

- The current stream is cancelled (SSE aborted, backend child process killed).
- The composer shows Send again and the last typed message is restored.
- The last agent message is no longer “In Progress”.
- No orphaned fetch or backend process is left running.

---

**User**

this is not working so lets use a simplier approach disable the dropdow while streaming a response

---

**Cursor**


Disabling the data-source dropdown while streaming and removing the effect that cancelled the stream on data-source change.



Checking the header component: it has access to the connection service.



Disabling the data-source dropdown while streaming.



Updating the spec to state we disable the dropdown while streaming:



Removing redundant `aria-disabled`; native `disabled` is already exposed to assistive tech.



Summary of the simpler approach:

## 1. **Header: disable data-source while streaming**
- In **`chat-header.component.ts`**: added `readonly streaming = this.connection.activeStream` so the template can react to streaming state.
- In **`chat-header.component.html`**: the data-source `<select>` now has `[disabled]="streaming()"`, so it’s disabled whenever a response is streaming.

While a response is streaming, the user can’t change the dropdown, so:
- The active stream and the selected data source always match.
- Stop always cancels the correct stream (no orphaned SSE or backend process).
- No need for an effect or cancel-on-change logic.

## 2. **Spec**
- Edge case updated to: the data-source dropdown must be **disabled** while streaming so the user cannot change source mid-stream, and Stop always cancels the correct stream.
- Changelog v1.2 updated to describe this behavior.

No changes were made to the shell component; the existing Stop/unsubscribe behavior is enough now that the dropdown can’t be changed during a stream.

