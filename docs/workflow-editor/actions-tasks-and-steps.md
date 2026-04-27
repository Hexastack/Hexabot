---
icon: bolt
---

# Actions, Tasks, and Steps

Actions, tasks, and steps are related, but they are not the same thing.

<table><thead><tr><th width="128.27203369140625">Concept</th><th width="234.94818115234375">Where you see it</th><th>What it means</th></tr></thead><tbody><tr><td>Action</td><td>Action drawer and <code>defs.&#x3C;task_id>.action</code></td><td>A registered operation Hexabot can run, such as sending a message, calling an AI model, reading memory, updating a subscriber, or making a web request.</td></tr><tr><td>Task</td><td><code>defs.&#x3C;task_id></code></td><td>A named configuration of one action. It supplies inputs, settings, and optional bindings for that action.</td></tr><tr><td>Step</td><td><code>flow</code></td><td>An item in the execution plan. A step can run a task with <code>do</code>, or it can control execution with a conditional, parallel block, or loop.</td></tr></tbody></table>

In normal editor use, you select an action from the drawer. Hexabot creates a task definition for that action, then inserts a step that runs the task.

<figure><img src="../.gitbook/assets/image (43).png" alt=""><figcaption></figcaption></figure>

### The Basic Pattern

A simple workflow has one task in `defs` and one matching step in `flow`:

<figure><img src="../.gitbook/assets/image (45).png" alt=""><figcaption></figcaption></figure>

```yaml
defs:
  send_greeting:
    kind: task
    description: Send a greeting back to the subscriber.
    action: send_text_message
    inputs:
      text: "='Hello ' & $input.text"
    settings:
      typing: true

flow:
  - do: send_greeting

outputs:
  sent: "=$output.send_greeting.sent"
```

In this example:

| Part                         | Meaning                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `send_text_message`          | The action name. It identifies the backend operation to run.                  |
| `send_greeting`              | The task ID. It is the workflow-local name for this configured action call.   |
| `defs.send_greeting`         | The task definition. It stores the action, inputs, settings, and description. |
| `- do: send_greeting`        | The step. It tells the flow to execute the `send_greeting` task.              |
| `$output.send_greeting.sent` | The result path. Task results are available under `$output.<task_id>`.        |

This separation lets one workflow keep action configuration in `defs` while using `flow` only for execution order.

### Actions

An action is a capability made available by Hexabot. The workflow author usually does not edit action code. Instead, actions appear in the action drawer with a title, technical name, description, group, icon, and color.

Actions define the forms the editor shows:

| Action metadata    | How it affects the editor                                                       |
| ------------------ | ------------------------------------------------------------------------------- |
| Input schema       | Builds the task input form. These values become `defs.<task_id>.inputs`.        |
| Settings schema    | Builds the action settings form. These values become `defs.<task_id>.settings`. |
| Output schema      | Describes values that can be read later from `$output.<task_id>`.               |
| Supported bindings | Allows attachment of related definitions, such as tools, model, or memory.      |

The action name is the value used in YAML:

```yaml
defs:
  notify_user:
    kind: task
    action: send_text_message
```

The action must be available for the workflow type you are editing. For example, some actions may appear for conversational workflows but not for manual or scheduled workflows.

### Tasks

A task is a named action configuration under `defs`.

```yaml
defs:
  notify_user:
    kind: task
    action: send_text_message
    inputs:
      text: "Your request was received."
    settings:
      typing: true
```

A task definition can contain:

| Field         | Required | Purpose                                                               |
| ------------- | -------- | --------------------------------------------------------------------- |
| `kind`        | Yes      | Must be `task` for executable task definitions.                       |
| `description` | No       | Human-readable note shown in editor context and useful during review. |
| `action`      | Yes      | Technical action name to run.                                         |
| `inputs`      | No       | Values passed to the action. Values can be literals or expressions.   |
| `settings`    | No       | Execution settings and action-specific settings.                      |
| `bindings`    | No       | References to binding definitions used by the action.                 |

Use stable, readable task IDs because they become part of expression paths. For example, `send_order_status` is easier to understand later than `task_7`.

#### Inputs

Task inputs provide the action's runtime data.

```yaml
defs:
  send_reply:
    kind: task
    action: send_text_message
    inputs:
      text: "='You said: ' & $input.text"
```

Input values can be:

| Value type                        | Example                           | Behavior                        |
| --------------------------------- | --------------------------------- | ------------------------------- |
| Literal string                    | `text: "Hello"`                   | Sent exactly as written.        |
| Expression string                 | `text: "='Hello ' & $input.name"` | Evaluated before the task runs. |
| Number, boolean, object, or array | `limit: 5`                        | Passed as structured data.      |

Any string that starts with `=` is evaluated as a [JSONata](https://jsonata.org/) expression. Strings that do not start with `=` are treated as literal values.

#### Settings

Task settings control action-specific behavior and shared execution behavior.

```yaml
defs:
  send_reply:
    kind: task
    action: send_text_message
    settings:
      typing: true
      timeout_ms: 10000
      retries:
        enabled: false
```

Common execution settings include:

| Setting                | Purpose                                                                           |
| ---------------------- | --------------------------------------------------------------------------------- |
| `timeout_ms`           | Maximum task execution time in milliseconds. A value of `0` disables the timeout. |
| `retries.enabled`      | Turns retry behavior on or off.                                                   |
| `retries.max_attempts` | Maximum number of attempts when retries are enabled.                              |
| `retries.backoff_ms`   | Initial delay between retry attempts.                                             |
| `retries.max_delay_ms` | Maximum retry delay.                                                              |

Workflow-level defaults can define shared settings for every task. A task can override those defaults when it needs different behavior.

```yaml
defaults:
  settings:
    timeout_ms: 10000
    retries:
      enabled: false

defs:
  slow_lookup:
    kind: task
    action: http_request
    settings:
      timeout_ms: 30000
```

In this example, most tasks inherit the `10000` millisecond timeout, while `slow_lookup` uses `30000`.

#### Task Outputs

When a task finishes, Hexabot stores the action result under `$output.<task_id>`.

```yaml
outputs:
  message_sent: "=$output.send_greeting.sent"
```

Task output is the raw result returned by the action. The workflow's final `outputs` section is where you shape the values that should be returned by the whole workflow.

### Steps

Steps live in `flow`. They define what runs and in what order.

The simplest step runs a task:

```yaml
flow:
  - do: send_greeting
```

A `do` step must reference a task definition in `defs`. It cannot reference an action directly, and it cannot reference a non-task binding definition.

These are the main step shapes:

| Step type   | YAML shape                        | Use it for                                                    |
| ----------- | --------------------------------- | ------------------------------------------------------------- |
| Task step   | `- do: task_id`                   | Running one configured task.                                  |
| Conditional | `- conditional: { when: [...] }`  | Choosing one branch based on expressions.                     |
| Parallel    | `- parallel: { strategy, steps }` | Running independent branches as one block.                    |
| Loop        | `- loop: { type, steps }`         | Repeating steps over items or while a condition remains true. |

Steps can also be nested inside control-flow blocks:

```yaml
flow:
  - conditional:
      when:
        - condition: "=$input.text = 'help'"
          steps:
            - do: send_help
        - else: true
          steps:
            - do: send_fallback
```

The graph view turns these step shapes into task nodes, operator nodes, branch edges, and insertion points.

### Bindings

Some actions can use extra definitions such as tools, model, or memory. These are called bindings.

Binding definitions also live under `defs`, but they are not executable task steps. A task references them through `bindings`.

The editor normally creates and edits these definitions through binding drawers and generated forms. In YAML, the shape looks like this:

```yaml
defs:
  primary_model:
    kind: model
    settings:
      provider: openai
      model_id: gpt-5.2
      api_key: credential_id_from_credentials

  support_memory:
    kind: memory
    settings:
      definition_id: 00000000-0000-4000-8000-000000000000

  answer_with_context:
    kind: task
    action: ai_generate_reply
    inputs:
      input_mode: prompt
      prompt: "=$input.text"
    bindings:
      model: primary_model
      memory:
        - support_memory

flow:
  - do: answer_with_context
```

In this example, `primary_model` and `support_memory` are binding definitions. The task `answer_with_context` mounts them through `bindings` before running `ai_generate_reply`.

Some binding kinds accept one reference and others accept multiple references:

| Binding kind                                   | YAML reference shape       |
| ---------------------------------------------- | -------------------------- |
| Single binding, such as `model`                | `model: primary_model`     |
| Multiple bindings, such as `memory` or `tools` | `memory: [support_memory]` |

In the graph, bindings can appear as attachment nodes connected to the task that uses them. The exact binding kinds available depend on the selected action.

### Execution Flow

When a workflow runs, Hexabot applies the same model shown in the editor:

1. The YAML definition is validated.
2. `defs` are checked so every `do` step points to an existing task.
3. Tasks are matched to available actions.
4. Literal values and expressions are prepared for execution.
5. The `flow` steps run in order.
6. Task inputs are evaluated right before their task runs.
7. Each task result is stored under `$output.<task_id>`.
8. Final `outputs` are evaluated after the flow finishes.

This is why task IDs matter: they are both editor labels and stable expression paths for later steps and final outputs.

### Common Mistakes

| Mistake                                          | How to fix it                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Referencing an action directly in `flow`         | Create or use a task in `defs`, then reference it with `do`.                          |
| Using a `do` value that does not exist in `defs` | Rename the step or create the missing task definition.                                |
| Referencing a binding definition with `do`       | Only `kind: task` definitions can be executed as steps.                               |
| Expecting a task to reshape its own output       | Use the workflow-level `outputs` section to define the final result shape.            |
| Forgetting the `=` prefix for dynamic values     | Start [JSONata](https://jsonata.org/) expressions with `=`, such as `"=$input.text"`. |
| Using an unavailable action                      | Check that the action appears for the selected workflow type.                         |

