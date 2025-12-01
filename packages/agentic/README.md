# @hexabot-ai/agentic

Typed runtime and YAML DSL for orchestrating multi-step AI/automation workflows. The package combines JSONata-powered expressions, schema validation, and a resumable runner so you can wire LLMs, tools, and human-in-the-loop pauses with guardrails.

## Highlights
- Declarative workflow DSL in YAML or JS objects with JSONata expressions (prefixed by `=`) and clear scopes (`$input`, `$context`, `$memory`, `$output`, `$iteration`, `$accumulator`, `$result`).
- Type-safe actions built with `defineAction`, Zod-validated IO, and merged settings (timeouts, retries, guardrails) inherited from workflow defaults.
- Resumable execution via `WorkflowRunner` and `context.workflow.suspend`, plus snapshots for persistence and replay.
- Flow primitives: sequential `do`, `parallel` blocks (`wait_all`/`wait_any`), `conditional` branches, and `loop` with accumulators and early-exit conditions.
- Event emitter hooks for observability (`workflow:start|finish|failure|suspended`, `step:start|success|error|suspended|skipped`).

## Installation

```bash
pnpm add @hexabot-ai/agentic
# or
npm install @hexabot-ai/agentic
```

Requires Node.js >= 20.18.1.

## DSL essentials

A workflow is a single YAML (or object) that declares metadata, inputs, tasks, control-flow, and outputs. The full annotated reference lives in `./DSL.md` and `example/workflow.yml`. The important pieces:

- `workflow`: name/version/description.
- `inputs.schema`: JSON-schema-like fields validated at runtime.
- `context` and `memory`: read-only values injected by the host and exposed to expressions.
- `defaults.settings`: inherited by every task (timeouts, retries, guardrails, audit flags).
- `tasks`: catalog of actions to call; names must be `snake_case`. Each task declares `inputs`, `outputs`, `settings`.
- `flow`: ordered list of steps combining `do`, `parallel`, `conditional`, `loop`.
- `outputs`: expressions evaluated after the flow finishes.

Any string starting with `=` is parsed as JSONata; everything else is literal. Expressions receive `{ input, context, memory, output, iteration, accumulator, result }` as scope.

## Defining actions

Actions wrap your IO or model calls. `defineAction` enforces schemas and merges settings.

```ts
import { defineAction, Settings, WorkflowContext } from '@hexabot-ai/agentic';
import { z } from 'zod';

class AppContext extends WorkflowContext {
  log(message: string, payload?: unknown) {
    console.log(message, payload);
  }
}

export const call_api = defineAction<{ id: string }, { body: string }, AppContext, Settings>({
  name: 'call_api', // must match task.action
  description: 'Fetches data from an API',
  inputSchema: z.object({ id: z.string() }),
  outputSchema: z.object({ body: z.string() }),
  execute: async ({ input, context, settings }) => {
    context.log('calling api', { id: input.id, timeout: settings.timeout_ms });
    return { body: `result for ${input.id}` };
  },
});
```

Settings are parsed and merged with workflow defaults before `execute` runs; retries and timeout wrappers are applied automatically. Throwing `WorkflowSuspendedError` (via `context.workflow.suspend`) pauses the workflow.

## Running a workflow from YAML

```ts
import { Workflow, WorkflowEventEmitter, WorkflowContext } from '@hexabot-ai/agentic';
import fs from 'node:fs';

const yamlSource = fs.readFileSync('workflow.yml', 'utf8');
const actions = { call_api }; // keys are task.action names

class AppContext extends WorkflowContext {}

const workflow = Workflow.fromYaml(yamlSource, actions);

const emitter = new WorkflowEventEmitter();
emitter.on('step:start', ({ step }) => console.log('start', step.id));

const runner = await workflow.buildAsyncRunner({ eventEmitter: emitter });
const startResult = await runner.start({
  inputData: { id: '123' },
  context: new AppContext({ user_id: 'user-1' }),
  memory: { thread_id: 'thread-1' },
});

if (startResult.status === 'finished') {
  console.log('output', startResult.output);
} else if (startResult.status === 'suspended') {
  // persist startResult.snapshot and prompt the user; resume later:
  const resumeResult = await runner.resume({ resumeData: { reply: 'go' } });
  console.log(resumeResult.status, resumeResult.output);
}
```

You can also skip YAML and use `Workflow.fromDefinition` with a typed object that matches `WorkflowDefinition`.

### Minimal YAML example

```yaml
workflow:
  name: "hello_world"
  version: "1.0.0"
tasks:
  greet_user:
    action: call_api
    inputs:
      id: "=$input.user_id"
    outputs:
      message: "='Hello ' & $result.body"
flow:
  - do: greet_user
outputs:
  reply: "=$output.greet_user.message"
inputs:
  schema:
    user_id:
      type: string
```

## Suspension and human-in-the-loop

Inside an action you can pause execution and surface metadata to the caller:

```ts
export const await_user = defineAction<unknown, { reply?: string }, AppContext, Settings>({
  name: 'await_user',
  execute: async ({ context }) => {
    const resumeData = await context.workflow.suspend({
      reason: 'awaiting_user',
      data: { prompt: 'Please confirm' },
    });
    return { reply: (resumeData as { reply?: string })?.reply };
  },
});
```

`Workflow.run` throws `WorkflowSuspendedError` when this happens; `WorkflowRunner.start` instead returns `{ status: 'suspended', ... }` so hosts can persist state and resume later with `runner.resume`.

## Events and observability

`WorkflowEventEmitter` mirrors lifecycle hooks:

- `workflow:start | finish | failure | suspended`
- `step:start | success | error | suspended | skipped`

Attach listeners to stream logs, emit metrics, or capture snapshots for debugging.

## Examples and scripts

- Full annotated DSL and runnable example: `packages/agentic/example/DSL.md`, `example/workflow.yml`, `example/workflow.ts`.
- Mock action implementations: `packages/agentic/example/actions/*`.
- Run the demo: `pnpm dlx ts-node packages/agentic/example/workflow.ts`.

## Development

From the repository root:

```bash
pnpm --filter @hexabot-ai/agentic build
pnpm --filter @hexabot-ai/agentic test
```

The codebase is TypeScript-first and validated with Zod; expressions use JSONata under the hood.
