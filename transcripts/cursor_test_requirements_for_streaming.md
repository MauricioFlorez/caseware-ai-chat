# Test requirements for streaming service
_Exported on 2/23/2026 at 15:22:31 GMT-5 from Cursor (2.5.20)_

---

**User**

Ok time to add tests:
Here the minimum tests required:
1. 2. 3. A test that asserts agent messages are appended incrementally when multiple
delta events arrive.
A test that simulates an interrupted stream and verifies UI shows a recoverable
state (retry works).
A test that verifie

below, my porposal
Automated (unit/integration)
* SseStreamService: In a test, call send(), then simulate:
* response.ok === false
* fetch rejection (e.g. network error)
* reader.read() throwing (and not AbortError)
and assert: connectionState.mode() becomes 'disconnected', setActiveStream(false) is called, and events emits one { type: 'error', message }.  Assert events does not emit error when the thrown error has name === 'AbortError'.
* ChatShellComponent: With a mock StreamSource that emits { type: 'error', message: '...' }, assert:
* Last message gets streamState: 'error' and errorInfo
* errorPanel() is set (e.g. userMessageId + message)
* retryDisabled() becomes false.
Then call onRetry() and assert it calls the stream’s send with lastSentTextForRetry() and that retryDisabled() is true until the next done/error.
* Error panel: Render with message and retryDisabled inputs; assert the message is shown and the Retry button is disabled when retryDisabled is true; when false, assert clicking the button emits the retry output.


---

**Cursor**


Adding the proposed tests. Exploring the codebase and frontend testing approach.



Checking ConnectionStateService and MockStreamService and how the shell gets its stream:



Checking how the error panel is rendered in the conversation view and whether HttpClient is used:



Creating the test files.



Configuring TestBed before injecting. Fixing the spec:



Accounting for retry logic: fetch rejection is retried up to 4 times with 2s delay. Using fakeAsync/tick to advance time so the test receives the final error.



Using fakeAsync so we don't rely on real time:



Adding ChatShellComponent and ErrorPanelComponent tests.



Creating the ChatShellComponent spec. Checking how to get the stream instance in the shell:



Fixing assertions: the component calls `send(trimmed)` with one argument.



Adding the ErrorPanelComponent spec.



Running the full test suite to confirm all tests pass:



Summary of what was added:

### 1. **SseStreamService** (`frontend/src/app/core/sse-stream.service.spec.ts`)

- **response.ok === false** (e.g. 400): `connectionState.mode()` becomes `'disconnected'`, `setActiveStream(false)` is called, and `events` emits a single `{ type: 'error', message }`.
- **fetch rejection** (e.g. network error): same assertions after retries are exhausted; uses `fakeAsync`/`tick` to advance the 2s retry delays.
- **reader.read() throws** (not AbortError): same disconnected state and one error event.
- **AbortError**: when fetch rejects with `name === 'AbortError'`, `events` does **not** emit an error.
- **reader.read() AbortError**: when the stream reader throws AbortError, `events` does **not** emit an error.

### 2. **ChatShellComponent** (`frontend/src/app/features/chat/chat-shell.component.spec.ts`)

- **Incremental deltas**: with a fake `StreamSource` (provided as `SseStreamService` with `dataSource === 'live'`), multiple `delta` events are appended to the last agent message, then `done` sets `streamState` to `'done'`.
- **Error state**: when the stream emits `{ type: 'error', message }`, the last message has `streamState: 'error'` and `errorInfo`, `errorPanel()` is set (e.g. `userMessageId` + `message`), and `retryDisabled()` is `false`.
- **Retry**: after an error, `onRetry()` calls the stream’s `send()` with `lastSentTextForRetry()` and `retryDisabled()` becomes `true` until the next `done` (or `error`).
- **Interrupted stream**: partial deltas then error show a recoverable state; `onRetry()` calls `send('Ask')` and Retry is disabled until the next completion.

### 3. **ErrorPanelComponent** (`frontend/src/app/features/chat/error-panel/error-panel.component.spec.ts`)

- **Message and disabled Retry**: with `message` and `retryDisabled: true`, the message is shown and the Retry button is disabled.
- **Retry enabled**: with `retryDisabled: false`, the Retry button is not disabled.
- **Retry emit**: with `retryDisabled: false`, clicking Retry emits the `retry` output.
- **Max retries**: with `retryCount >= 2`, the alternate message is shown and the Retry button is not rendered.

All **14** frontend tests pass (including the existing `AppComponent` spec), and there are no new linter issues. The ChatShell tests use a fake `StreamSource` provided in place of `SseStreamService` with `DataSourceService` set to `'live'`, so no backend or real HTTP is used.

---

**User**

ok time to update the package, 
in the root of the project, well enable some commands to:
1.  run backend + frontend
2. run tests 

---

**Cursor**


Adding root scripts: keep `dev` (backend + frontend in parallel) and add `test` to run all workspace tests.



Verifying the `test` script runs from the repo root:


