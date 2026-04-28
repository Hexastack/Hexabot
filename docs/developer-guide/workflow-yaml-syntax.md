---
description: >-
  Understand Hexabot workflow YAML structure, execution rules, and authoring
  patterns for tasks, flow, and outputs.
icon: terminal
---

# Workflow YAML Syntax

Workflow logic is stored as YAML on workflow versions and derives a compiled runtime graph when a workflow run starts or resumes.

Use this page when you are writing editor code, debugging validation, generating YAML, or adding new workflow DSL features. For a concise user-facing reference, see Workflow YAML Reference.

### Complete Shape

A workflow definition is a YAML object with optional input/context/default sections and required `defs`, `flow`, and `outputs` sections:

```yaml
defaults:
  settings:
    timeout_ms: 0
    retries:
      enabled: false
      max_attempts: 3
      backoff_ms: 25
      max_delay_ms: 10000
      jitter: 0
      multiplier: 1

defs:
  send_reply:
    kind: task
    description: Send a response.
    action: send_text_message
    inputs:
      text: "='You said: ' & $input.text"

flow:
  - do: send_reply

outputs:
  sent: "=$output.send_reply.sent"
```

<table><thead><tr><th width="117.52490234375">Section</th><th width="107.52978515625">Required</th><th>Purpose</th></tr></thead><tbody><tr><td><code>defaults</code></td><td>No</td><td>Workflow-level execution settings merged into every task's settings.</td></tr><tr><td><code>defs</code></td><td>Yes</td><td>Registry of task definitions and binding definitions. It may be <code>{}</code> in a blank draft.</td></tr><tr><td><code>flow</code></td><td>Yes</td><td>Ordered array of executable steps and operators. It may be <code>[]</code> in a blank draft.</td></tr><tr><td><code>outputs</code></td><td>Yes</td><td>Final output mapping evaluated after the flow finishes. It may be <code>{}</code> when the workflow does not expose a result.</td></tr></tbody></table>

### Values and Expressions

Any string that starts with `=` is compiled as a [**JSONata**](https://jsonata.org/) expression. Other strings are literals.

```yaml
inputs:
  text: "Hello"          # literal string
  normalized: "=$trim($input.text)" # expression
```

Expression scopes are exposed as **JSONata** variables:

| Scope          | Available in                                                         | Meaning                                                                                                        |
| -------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `$input`       | Task inputs, operator expressions, final outputs                     | Validated run input payload.                                                                                   |
| `$context`     | Task inputs, operator expressions, final outputs                     | Runtime context state, including workflow/run IDs, initiator data, trigger context, and mounted memory values. |
| `$output`      | Task inputs after earlier steps, operator expressions, final outputs | Raw action results keyed by task ID, plus named loop accumulator outputs.                                      |
| `$iteration`   | Loop body expressions and loop accumulator expressions               | Current loop item and zero-based index.                                                                        |
| `$accumulator` | Loop body expressions and loop accumulator expressions               | Current accumulator value when `accumulate` is configured.                                                     |

Hexabot registers the API helper function `$t(string)` for localized JSONata strings during workflow execution.

```yaml
defs:
  localized_reply:
    kind: task
    action: send_text_message
    inputs:
      text: "=$t('Hello World!')"
```

Expression-aware fields are not recursively compiled. For task `inputs`, only each top-level input value is compiled. If an action input needs a dynamic object, make the whole top-level field an expression that returns the object.

```yaml
defs:
  call_api:
    kind: task
    action: http_request
    inputs:
      # Good: headers is one expression returning an object.
      headers: "={'Authorization': 'Bearer ' & $context.token}"
```

### Inputs

The YAML `inputs.schema` section belongs to the agentic runner. It supports a compact schema shape:

```yaml
inputs:
  schema:
    customer_id:
      type: string
      description: Customer identifier.
    priority:
      type: string
      enum: [low, normal, high]
    tags:
      type: array
      items:
        type: string
    options:
      type: object
      properties:
        dry_run:
          type: boolean
```

Supported field types are `string`, `number`, `integer`, `boolean`, `array`, and `object`. Array fields must declare `items`; only array fields may declare `items`. Object fields may declare `properties`; only object fields may declare `properties`. Input fields are optional at runtime, including nested object properties.

In the Hexabot API, manual workflow trigger forms use the workflow entity's `inputSchema`, which is stored outside the YAML definition. Conversational and scheduled workflows receive fixed input schemas from the API.

### Defaults and Settings

`defaults.settings` is deep-merged into every task's `settings`. Task-level settings override defaults, and `undefined` values do not erase default values.

```yaml
defaults:
  settings:
    timeout_ms: 10000
    retries:
      enabled: false
      max_attempts: 3

defs:
  slow_lookup:
    kind: task
    action: http_request
    settings:
      timeout_ms: 30000
```

Shared execution settings are:

<table><thead><tr><th width="222.60443115234375">Setting</th><th width="99.6207275390625">Default</th><th>Meaning</th></tr></thead><tbody><tr><td><code>timeout_ms</code></td><td><code>0</code></td><td>Maximum action runtime in milliseconds. <code>0</code> disables the timeout wrapper.</td></tr><tr><td><code>retries.enabled</code></td><td><code>false</code></td><td>Enables retry attempts for failing actions.</td></tr><tr><td><code>retries.max_attempts</code></td><td><code>3</code></td><td>Total attempts before the action fails.</td></tr><tr><td><code>retries.backoff_ms</code></td><td><code>25</code></td><td>Initial retry delay.</td></tr><tr><td><code>retries.max_delay_ms</code></td><td><code>10000</code></td><td>Maximum retry delay.</td></tr><tr><td><code>retries.jitter</code></td><td><code>0</code></td><td>Randomization factor applied to retry delays.</td></tr><tr><td><code>retries.multiplier</code></td><td><code>1</code></td><td>Backoff multiplier after each retry.</td></tr></tbody></table>

Action-specific settings share the same `settings` object. The editor splits shared execution settings from action settings when it validates against schemas.

### Definitions

All reusable workflow definitions live under `defs`.

#### Task Definitions

A task definition is executable and must use `kind: task`:

```yaml
defs:
  answer_user:
    kind: task
    description: Generate and send a reply.
    action: ai_generate_reply
    inputs:
      input_mode: prompt
      prompt: "=$input.text"
    settings:
      max_steps: 3
    bindings:
      model: primary_model
      memory:
        - support_memory
```

<table><thead><tr><th width="144.23223876953125">Field</th><th width="108.694580078125">Required</th><th>Meaning</th></tr></thead><tbody><tr><td><code>kind</code></td><td>Yes</td><td>Must be <code>task</code>.</td></tr><tr><td><code>description</code></td><td>No</td><td>Human-readable note for the editor and reviews.</td></tr><tr><td><code>action</code></td><td>Yes</td><td>Registered action name.</td></tr><tr><td><code>inputs</code></td><td>No</td><td>Top-level action input values. Each value may be a literal or expression.</td></tr><tr><td><code>settings</code></td><td>No</td><td>Shared execution settings plus action-specific settings.</td></tr><tr><td><code>bindings</code></td><td>No</td><td>References to non-task definitions grouped by binding kind.</td></tr></tbody></table>

Task IDs should use snake\_case with at least one underscore because the agentic compiler enforces that naming rule when actions are bound. Task output is always stored raw under `$output.<task_id>`; task-level output mapping is not supported.

#### Binding Definitions

Binding definitions are non-task `defs` entries. Their `kind` must match a registered runtime binding kind, and they must declare `settings`.

```yaml
defs:
  primary_model:
    kind: model
    settings:
      provider: openai
      model_id: gpt-5.2
      api_key: 00000000-0000-4000-8000-000000000000

  support_memory:
    kind: memory
    settings:
      definition_id: 00000000-0000-4000-8000-000000000000

  crm_tool:
    kind: tools
    action: http_request
    settings:
      method: GET
    bindings:
      model: primary_model
```

Built-in AI binding kinds include:

| Kind     | Multiple | Action policy    | Typical use                                                                                                 |
| -------- | -------- | ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `model`  | No       | Action forbidden | Mount one language model provider and model ID.                                                             |
| `memory` | Yes      | Action forbidden | Mount one or more memory definitions by `definition_id`.                                                    |
| `mcp`    | Yes      | Action forbidden | Mount MCP server tools by `server_id` and optional `tool_names`.                                            |
| `tools`  | Yes      | Action required  | Expose action-backed tools to AI actions. Tool bindings can themselves mount `tools`, `model`, or `memory`. |

Binding references must match the registered cardinality:

```yaml
bindings:
  model: primary_model      # single binding kind
  memory: [support_memory]  # multiple binding kind
```

Binding validation checks unknown kinds, unknown references, kind mismatches, duplicate references, action policy, unsupported nested bindings, binding settings schemas, and circular binding references.

### Flow Steps

`flow` is an ordered array. Each item must be exactly one step shape: `do`, `conditional`, `parallel`, or `loop`.

#### Task Step

```yaml
flow:
  - do: answer_user
```

`do` references a task definition name, not an action name. The referenced `defs.<name>` must exist and must have `kind: task`.

#### Conditional Step

```yaml
flow:
  - conditional:
      description: Route by message intent.
      when:
        - condition: "=$contains($lowercase($input.text), 'price')"
          steps:
            - do: send_pricing
        - condition: "=$contains($lowercase($input.text), 'support')"
          steps:
            - do: send_support_reply
        - else: true
          steps:
            - do: send_fallback
```

Branches are evaluated in order. The first truthy `condition` wins. An `else` branch is represented as a branch without `condition`, commonly written with `else: true`. If no branch matches and no `else` exists, the conditional does nothing and nested branch steps are marked skipped for tracing.

#### Parallel Step

```yaml
flow:
  - parallel:
      description: Fetch independent context.
      strategy: wait_all
      steps:
        - do: fetch_customer
        - do: fetch_orders
```

`strategy` may be `wait_all` or `wait_any`; omitted strategy defaults to `wait_all`. The current in-process runner executes child steps sequentially for deterministic behavior. With `wait_any`, it stops after the first child completes and marks the remaining child steps skipped, so downstream expressions must check which outputs exist.

#### For Each Loop

```yaml
flow:
  - loop:
      type: for_each
      name: notify_loop
      description: Notify each owner.
      for_each:
        item: owner
        in: "=$input.owners"
      max_concurrency: 5
      until: "=$exists($output.send_notification.accepted) and $output.send_notification.accepted"
      accumulate:
        as: notifications
        initial: []
        merge: "=$append($accumulator, [$output.send_notification])"
      steps:
        - do: send_notification
```

`for_each.in` must be an expression that evaluates to an array. Non-array results are treated as an empty array. `max_concurrency` is a positive integer metadata hint; the runner does not enforce real concurrency today. `until` is checked after each iteration and stops the loop early when truthy.

#### While Loop

```yaml
flow:
  - loop:
      type: while
      name: collect_missing_info
      while: "=$not($exists($output.await_reply.text))"
      steps:
        - do: ask_for_info
        - do: await_reply
```

`while` is evaluated before each iteration. The body does not run when the expression is false at the start of an iteration.

#### Accumulators

Both loop types support `accumulate`:

```yaml
accumulate:
  as: results
  initial: []
  merge: "=$append($accumulator, [$output.process_item])"
```

The merge expression receives `$input`, `$context`, `$output`, `$iteration`, and `$accumulator`. If the loop has both `name` and `accumulate`, the final value is exposed as `$output.<loop_name>.<accumulate.as>`.

### Outputs

`outputs` is a required map. Each value must be a JSONata expression string.

```yaml
outputs:
  reply_text: "=$output.answer_user.text"
  handled: "=$exists($output.answer_user)"
```

Outputs are evaluated only after the whole flow finishes. A suspended or failed workflow persists the intermediate execution state, but final `outputs` are not evaluated until completion.

### Authoring Checklist

1. Include `defs`, `flow`, and `outputs`, even when they are empty in a draft.
2. Use snake\_case task IDs such as `send_initial_reply`.
3. Keep `flow` entries as one-key step objects.
4. Reference task IDs with `do`; reference action names only inside task or action-backed binding definitions.
5. Quote expressions, especially those containing `:`, `{}`, `[]`, comparison operators, or string literals.
6. Keep dynamic task inputs at the top input-field level, or return a whole object from one expression.
7. Check optional outputs with `$exists(...)` when reading values from conditionals, `wait_any`, or skipped paths.
8. Give accumulator loops a `name` when later expressions need the accumulated value.
