# Agent Handbook — @hexabot-ai/agentic

Use this file as the predictable entrypoint for AI coding agents working on the `@hexabot-ai/agentic` package. The package is a typed workflow DSL plus a resumable runner for orchestrating multi-step AI/automation flows with JSONata expressions.

## Repository orientation
- Package root: `packages/agentic`.
- Product overview: `packages/agentic/README.md`.
- DSL reference: `packages/agentic/DSL.md` (annotated YAML language guide).
- Runtime source: `packages/agentic/src/*`.
- Example workflow + actions: `packages/agentic/example/workflow.yml|ts` and `packages/agentic/example/actions/*`.
- Tests: `packages/agentic/src/__tests__` (Jest).

## Tooling and commands
- Node.js >= 20.18.1; PNPM workspace (run commands from repo root).
- Build: `pnpm --filter @hexabot-ai/agentic build`
- Type-check: `pnpm --filter @hexabot-ai/agentic typecheck`
- Tests: `pnpm --filter @hexabot-ai/agentic test`
- Run the sample workflow: `pnpm dlx ts-node packages/agentic/example/workflow.ts`

## DSL essentials (YAML or JS object)
- Workflow parts: `workflow` metadata, optional `inputs.schema`, `context`, `memory`, `defaults.settings`, `tasks`, `flow`, `outputs`.
- Expressions: any string starting with `=` is JSONata; everything else is literal. Scopes: `$input`, `$context`, `$memory`, `$output`, `$iteration` (`item`, `index`), `$accumulator`, `$result` (only inside `tasks.*.outputs`).
- Flow primitives: `do` (single task), `parallel` (`strategy: wait_all|wait_any`), `conditional` (first truthy branch wins; optional `else`), `loop` (`for_each`, optional `until`, `accumulate`, `max_concurrency` hint).
- Tasks: names must be `snake_case`; each declares `action`, optional `inputs`/`outputs` maps, and `settings` that merge over `defaults.settings`.
- Outputs: required map evaluated after the flow; values are expressions that usually reference `$output.<task>.*`.

## Runtime architecture (TS)
- Entry points: `Workflow.fromYaml` / `Workflow.fromDefinition` validate via `validateWorkflow` then compile via `compileWorkflow` into a `CompiledWorkflow`.
- Runner: `WorkflowRunner.start` executes the compiled flow; `resume` continues after a suspension. `Workflow.run` is a convenience that throws `WorkflowSuspendedError` on suspension.
- Step ids: generated from the flow path (e.g., `0.branch.1:conditional`); loop iterations append `[i.j]` suffixes.
- Snapshots: every start/resume returns `{ status, snapshot }` with `WorkflowSnapshot.actions` capturing per-step status (`pending|running|suspended|completed|failed|skipped`).
- Events: `WorkflowEventEmitter` emits `workflow:start|finish|failure|suspended` and `step:start|success|error|suspended|skipped`.
- Evaluation order: task inputs are evaluated before marking a step as running; outputs are mapped via `evaluateMapping` (falls back to raw result when no outputs map is provided). Final workflow outputs are evaluated only after the flow completes.
- Parallel semantics: executed sequentially for determinism; `wait_any` short-circuits after the first completed child, `wait_all` waits for all.
- Loop semantics: iterates over evaluated `for_each.in` (arrays only), threads `$iteration` and accumulator; `until` is checked after each iteration; accumulated values are exposed under `$output.<loop_name>.<accumulator_alias>` when `name` is set.

## Actions and settings
- Create actions with `defineAction` (or extend `AbstractAction`): provide `name` (snake_case), optional `description`, `inputSchema`, `outputSchema`, optional `settingSchema`, and an async `execute`.
- `AbstractAction.run` handles `parseInput`, merges/parses settings (defaults live in `SettingsSchema`, including `timeout_ms` and retry policy), wraps `execute` with timeout/retries, and validates the output.
- Suspension: inside `execute`, call `context.workflow.suspend(options)`; the runner catches `WorkflowSuspendedError`, marks the step as `suspended`, and returns `{ status: 'suspended', step, reason?, data? }`. On resume, the provided data is passed back through `captureTaskOutput`.
- Settings merge: `mergeSettings` deep-merges `defaults.settings` with task-level overrides; undefined values do not clobber defaults.

## Conventions and gotchas
- Expressions must start with `=`; validation will parse JSONata and fail early on syntax errors.
- Task/action names are enforced as `snake_case` by `assertSnakeCaseName`.
- `max_concurrency` in loops is accepted in the DSL but not yet enforced by the in-process runner (treat it as a hint for now).
- `timeout_ms: 0` disables timeouts. Default retries come from `DEFAULT_RETRY_SETTINGS` (3 attempts, exponential backoff starting at 25ms, capped at 10s, no jitter).
- Outputs mapping is optional; when omitted the entire raw action result is stored under `$output.<task>`.
- `WorkflowContext.workflow` is attached only while running; don’t hold references beyond execution.

## When extending the package
- Add or adjust DSL shape in `packages/agentic/src/dsl.types.ts` and update `packages/agentic/DSL.md` plus the example workflow if behavior changes.
- Extend runtime behavior in `packages/agentic/src/workflow-*.ts`; keep tests in `packages/agentic/src/__tests__` in sync.
- For new actions in the example, update `packages/agentic/example/actions/*` and `example/workflow.yml` so the runnable demo continues to work.
- Prefer small, well-named helper functions; keep the public surface re-exported via `packages/agentic/src/index.ts`.

## Quick reference: example
- Annotated YAML DSL: `packages/agentic/example/workflow.yml` shows a realistic flow with human-in-the-loop pauses, branching, and a loop accumulator.
- Runnable script: `packages/agentic/example/workflow.ts` builds a workflow from YAML, registers actions, attaches an event emitter, and demonstrates `WorkflowRunner.start`.
