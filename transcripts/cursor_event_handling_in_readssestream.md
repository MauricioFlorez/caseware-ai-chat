# Event handling in readSSEStream
_Exported on 2/23/2026 at 15:24:03 GMT-5 from Cursor (2.5.20)_

---

**User**

Verify this issue exists and fix it:

In `readSSEStream`, the in-loop handler (lines 113–116) correctly returns after emitting a `done` or `error` event, preventing the synthetic `done` at line 139. However, the post-loop buffer handler (lines 125–137) emits events from the remaining buffer *without* returning on terminal events. If the buffer contains a `done` event (e.g., a connection drop before the trailing `\n\n` is received), both the buffer's `done` and the unconditional synthetic `done` at line 139 are emitted — producing a duplicate. @frontend/src/app/core/sse-stream.service.ts:124-139 

---

**Cursor**


Confirming the issue: the post-loop buffer block (124–136) emits `done`/`error` from the remaining buffer but doesn't return, so execution continues and the synthetic `done` at 137 is also emitted. Adding the same terminal handling in the post-loop block: after emitting, if the event is `done` or `error`, update connection state and return so we don't emit the synthetic `done`.



Summary of what was verified and changed:

**Issue:** In `readSSEStream`, the main loop (lines 104–121) returns after emitting a `done` or `error` event, so the synthetic `done` at line 137 is not emitted. The post-loop buffer handling (lines 124–136) did not do the same: when the remaining buffer held a complete `done` (or `error`) — e.g. connection closed before the final `\n\n` — it emitted that event but did not return, so the code still ran to line 137 and emitted the synthetic `done` again.

**Fix:** In the post-loop buffer block, after emitting an event from the buffer, we now treat `done` and `error` as terminal: set `connectionState.setActiveStream(false)`, for `error` also call `connectionState.setMode('disconnected')`, and `return` so the synthetic `done` at line 137 is not emitted. Behavior now matches the in-loop handler and duplicate `done` is avoided.

