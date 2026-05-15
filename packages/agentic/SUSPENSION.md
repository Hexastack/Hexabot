# Suspension Runtime Design

This document explains how suspension currently works in `@hexabot-ai/agentic` based on the staged runtime changes in `packages/agentic/src`.

## 1. What changed

Suspension is based async runtime-control model:

- Action code now pauses by awaiting `context.workflow.suspend(...)`.
- Runtime suspension metadata is now explicit and serializable:
  - `stepExecId`
  - `suspendIndex`
  - `suspendKey`
  - `awaitResults`

Core files:

- `src/runner-runtime-control.ts`
- `src/step-executors/task-executor.ts`
- `src/workflow-runner.ts`
- `src/suspension-rebuilder.ts`
- `src/workflow-types.ts`

## 2. Public API behavior

### 2.1 Action-side API

```ts
const resumed = await context.workflow.suspend<{ reply: string }>({
  key: 'await-reply',
  reason: 'awaiting_user',
  data: { channel: 'sms' },
});
```

- `suspend()` returns a promise resolved by `runner.resume({ resumeData })`.
- `SuspensionOptions` includes `key` in addition to `reason` and `data`.

### 2.2 Runner results

When `start()`/`resume()` suspend, returned status now includes:

- `step`
- `reason`
- `data`
- `stepExecId`
- `suspendIndex`
- `suspendKey`
- `awaitResults`
- `snapshot`

These are defined on `StartResult`/`ResumeResult` and `Suspension`.

### 2.3 Persisted suspension contract

`PersistedSuspension` now supports:

- `stepId`
- `reason`
- `data`
- `stepExecId`
- `suspendIndex`
- `suspendKey`
- `awaitResults`

This metadata is required for deterministic replay when a step has multiple `suspend()` calls.

### 2.4 Errors

- `WorkflowSuspendedError` was removed.
- `Workflow.run(...)` now throws an internal `WorkflowRunSuspendedError` carrying `stepId`, `reason`, and `data`.
- `NonDeterministicWorkflowError` is exported and used to fail resume when replay metadata does not match runtime behavior.
- `ParallelSuspensionError` is exported and used when `context.workflow.suspend()` is attempted inside a parallel branch.

## 3. End-to-end control flow

### 3.1 Initial execution (`WorkflowRunner.start`)

1. Runner sets status to `running`, initializes state/context, and attaches runtime control.
2. Task executor starts action execution and simultaneously waits for:
   - action completion/failure/cancellation
   - first suspension request from that step
3. If suspension arrives first, executor returns a `Suspension` continuation to the runner.
4. Runner sets status to `suspended`, stores continuation, emits `hook:workflow:suspended`, and returns suspended result.

Inside a `parallel` branch, `context.workflow.suspend()` rejects with `ParallelSuspensionError`; the workflow fails instead of returning a suspended result.

### 3.2 In-action suspension (`RunnerRuntimeControl.suspend`)

Inside `suspend(options)`:

1. Resolve current step id from runner.
2. Get/create per-step execution state (`stepExecId`, cursor, await history).
3. Increment `suspendCursor` -> `suspendIndex`.
4. Build `suspendKey`:
   - `index:<n>` when no custom key
   - `key:<custom>` when `options.key` is provided
5. Validate replay expectation (if resume was rebuilt from persisted metadata).
6. Fast paths:
   - if `awaitResults[suspendKey]` exists, return it immediately
   - else if primed resume data exists, return it immediately
7. Otherwise enqueue a `RuntimeSuspensionRequest` and return its deferred promise.

Parallel branch contexts replace the normal runtime control with one that rejects `suspend()` immediately. This avoids ambiguous multi-branch checkpoints and durable replay anomalies.

### 3.3 Resume (`Suspension.continue` + `WorkflowRunner.resume`)

1. Host calls `runner.resume({ resumeData })`.
2. Runner invokes stored continuation.
3. Continuation:
   - stores resume payload via `recordStepSuspendResult(...)` (by key/index when available)
   - resolves the deferred suspension promise (unblocking action code at `await suspend(...)`)
   - races again for:
     - action completion
     - next suspension (same action can suspend again)
4. Outcomes:
   - `completed` -> capture output, mark step completed, continue workflow
   - `suspended` -> return a new `Suspension` for next await point
   - `failed` -> mark step failed and return failed run result

Continuation is one-shot; calling it twice throws.

## 4. Internal runtime state model

`RunnerRuntimeControl` tracks step-local suspension state in maps:

- `pendingSuspensions: Map<stepId, RuntimeSuspensionRequest[]>`
  - queued suspension notices waiting for executor consumption
- `suspensionWaiters: Map<stepId, resolver[]>`
  - executor waiters blocked on next suspension
- `primedResumeData: Map<stepId, unknown[]>`
  - fallback replay payloads for legacy/no-key metadata
- `activeStepExecutions: Map<stepId, StepExecutionState>`
  - active step runtime state: cursor, await history, replay expectation
- `replaySeeds: Map<stepId, StoredReplaySeed>`
  - replay bootstrap state injected before step re-execution
- `stepAttempts: Map<stepId, number>`
  - monotonically tracks `<stepId>#<attempt>`

## 5. Key metadata semantics

### 5.1 `stepExecId`

- Format: `<stepId>#<attempt>`
- New attempt id created each time a step execution starts (unless replay seed provides one).
- Used to correlate persisted suspension metadata to the right execution attempt.

### 5.2 `suspendIndex`

- 1-based per step execution.
- Increments each time that step calls `suspend()`.

### 5.3 `suspendKey`

- Normalized key for suspend point identity.
- Generated from:
  - `index:<suspendIndex>` by default
  - `key:<user_key>` when user passes `key`
- Normalization supports compatibility inputs:
  - already-prefixed keys remain unchanged
  - numeric raw keys normalize to `index:<n>`
  - other raw strings normalize to `key:<raw>`

### 5.4 `awaitResults`

- Snapshot of previously resumed suspend values for this step execution.
- Included in suspended status payload.
- Example for a step suspended on second await point:

```json
{
  "suspendIndex": 2,
  "suspendKey": "index:2",
  "awaitResults": {
    "index:1": { "reply": "first-answer" }
  }
}
```

## 6. Multiple suspend points in one action

A single action can suspend repeatedly:

```ts
const first = await context.workflow.suspend({ reason: 'first' });
const second = await context.workflow.suspend({ reason: 'second' });
return { first, second };
```

Runtime behavior:

1. first `suspend()` -> workflow pauses (`index:1`).
2. resume with payload A -> first await resolves to A.
3. action reaches second `suspend()` -> pauses again (`index:2`) and includes `awaitResults[index:1] = A`.
4. resume with payload B -> second await resolves to B and action can complete.

## 7. Persisted resume / rebuild behavior

### 7.1 What hosts should persist on suspension

- `runner.getState()`
- suspended `snapshot`
- full suspension metadata fields from `start()/resume()` result

Recommended persisted shape:

```ts
{
  state,
  snapshot,
  suspension: {
    stepId,
    reason,
    data,
    stepExecId,
    suspendIndex,
    suspendKey,
    awaitResults,
  },
}
```

### 7.2 Rebuild path

`WorkflowRunner.fromPersistedState(...)` calls `rebuildSuspension(...)`, which:

1. Parses `stepId` path and loop iteration suffix (`[i.j]`).
2. Walks compiled flow tree (`task`, `conditional`, `loop`) to locate suspended node. Suspensions whose path is inside `parallel` are rejected because parallel suspension is unsupported.
3. Builds a continuation that replays only the suspended step, then resumes normal flow.
4. Injects replay seed and previously resumed data via:
   - `prepareStepReplay(...)`
   - `recordStepSuspendResult(...)` when suspend metadata is available
   - fallback `primeStepResumeData(...)` when metadata is missing

The fallback keeps older persisted format working for simple first-suspend resumes.

## 8. Deterministic replay guarantees

Replay validation protects against code drift between suspend and resume.

`NonDeterministicWorkflowError` is thrown when:

- replay reaches a different suspend point before expected one
- expected suspend key is reached but reason mismatches (when reason is part of replay expectation)
- step completes without ever reaching expected suspension

Validation allows traversing already-resolved suspend points listed in `awaitResults` before reaching the expected active suspend.

## 9. Snapshot/events lifecycle around suspension

Step-level lifecycle for a suspending task:

1. `running`
2. `suspended`
3. `completed` (after resume and eventual completion) or `failed`

Events:

- Step:
  - `hook:step:start`
  - `hook:step:suspended`
  - `hook:step:success` or `hook:step:error`
- Workflow:
  - `hook:workflow:suspended`
  - then `hook:workflow:finish` or `hook:workflow:failure`

## 10. Operational caveats

- Action code must `await` `workflow.suspend(...)`. Calling it without `await` can lead to cancellation of that suspend request.
- `workflow.suspend()` outside an active step throws.
- `workflow.suspend()` inside `parallel` fails with `ParallelSuspensionError`; move human-in-the-loop waits before or after the parallel block.
- Actions receive an `AbortSignal` and should observe it so cancelled parallel losers can stop promptly.
- Timeouts/retries in `AbstractAction.run()` wrap the full action execution; if non-zero timeout is used, suspended wall time counts toward that timeout.
- `Workflow.run(...)` suspended errors are not exported as a public class; treat them structurally (`stepId`, `reason`, `data`) or use `WorkflowRunner` for explicit status objects.

## 11. Test coverage for this implementation

Relevant tests:

- `src/__tests__/workflow-runner.test.ts`
  - suspension/resume happy paths
  - multi-suspend metadata persistence/rebuild
  - non-deterministic replay failure
- `src/step-executors/task-executor.test.ts`
  - in-flight action resume behavior
- `src/__tests__/suspension-rebuilder.test.ts`
  - path parsing and continuation rebuild for task/loop, plus rejection of parallel suspension paths
- `src/__tests__/workflow.test.ts`
  - `Workflow.run()` suspension throw shape
