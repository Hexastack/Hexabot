---
icon: chart-diagram
---

# Graph View and YAML Editor

The graph view renders the compiled workflow as nodes and edges. The YAML view exposes the workflow source definition stored in workflow versions.

<figure><img src="../.gitbook/assets/image (41).png" alt=""><figcaption></figcaption></figure>

Both views represent the same workflow. Graph edits update `defs` and `flow`, while YAML edits are validated and reflected back into the graph.

### How the Two Views Relate

The YAML definition is the source of truth for workflow logic. Hexabot saves it on workflow versions as `definitionYml`. The graph is a visual projection of that definition after Hexabot validates and compiles the workflow.

| View       | Primary purpose                                    | Best for                                                                                                                                    |
| ---------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Graph view | Visual authoring and review of the execution path. | Adding steps, reading branches, selecting nodes, configuring actions, inspecting bindings, and presenting the workflow to non-code authors. |
| YAML view  | Direct editing of the persisted workflow source.   | Reviewing exact workflow structure, editing expressions, making precise changes, copying definitions, and debugging validation issues.      |

When you add or edit a step from the graph, the editor rewrites the YAML definition. When you edit YAML directly, the editor validates and compiles the definition before the graph can render it accurately.

### Graph View

The graph canvas shows the workflow as an execution diagram. It is built from the compiled `flow` and task or binding definitions in `defs`.

The graph can show:

| Graph element                | What it represents in YAML                                                 |
| ---------------------------- | -------------------------------------------------------------------------- |
| Start and end indicators     | The beginning and end of the compiled flow.                                |
| Task nodes                   | `flow` entries that execute a named `defs.<task_id>` task.                 |
| Operator nodes               | Control-flow steps such as `conditional`, `parallel`, and `loop`.          |
| Branch placeholders          | Empty branch locations where a step can be inserted.                       |
| Edges                        | Execution order and branch paths.                                          |
| Add buttons and insert menus | Insertion points inside `flow` or nested step arrays.                      |
| Binding attachment nodes     | Binding definitions referenced by a task, such as tools, model, or memory. |

Use the graph when you want to understand or change the workflow structure without editing YAML by hand.

Common graph actions include:

* inserting an action step from the action drawer;
* inserting conditional, parallel, or loop blocks;
* selecting nodes to open configuration drawers;
* deleting steps;
* attaching or removing supported bindings;
* rotating the graph between horizontal and vertical layout;
* panning, zooming, and fitting the view.

#### Graph Edits and YAML Changes

Graph edits change the YAML definition rather than storing a separate graph-only model.

For example, adding a text message action creates a new task under `defs`, then inserts a matching `do` step into `flow`:

```yaml
defs:
  send_text_message:
    kind: task
    action: send_text_message
    inputs:
      text: ""

flow:
  - do: send_text_message
```

If you insert that same action inside a conditional branch or loop body, the new `do` step is placed inside that nested `steps` array instead of at the root `flow` level.

### YAML Workflow Definition

The YAML editor shows the exact definition that Hexabot stores for the current workflow version. It is the best place to review the workflow as a portable source document.

A workflow definition uses these top-level sections:

| Section    | Required    | Purpose                                                                   |
| ---------- | ----------- | ------------------------------------------------------------------------- |
| `defaults` | Recommended | Workflow-wide execution settings inherited by tasks.                      |
| `defs`     | Yes         | Reusable definitions. Task definitions and binding definitions live here. |
| `flow`     | Yes         | Ordered execution plan rendered by the graph.                             |
| `outputs`  | Optional    | Final values returned after the workflow finishes.                        |

#### `defaults`

`defaults` stores workflow-level settings that tasks can inherit. The common settings are timeout and retry behavior.

```yaml
defaults:
  settings:
    timeout_ms: 10000
    retries:
      enabled: false
      max_attempts: 3
      backoff_ms: 25
      max_delay_ms: 10000
      jitter: 0
      multiplier: 1
```

Task-level settings can override these defaults when a specific action needs different execution behavior.

#### `defs`

`defs` is the registry of named definitions. The most common definition is a task:

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
```

Each task chooses an action and provides that action with inputs and settings. If the action supports bindings, the task can also reference binding definitions from `defs`.

#### `flow`

`flow` defines execution order. A simple task step uses `do` to reference a task from `defs`:

```yaml
flow:
  - do: send_greeting
```

Control-flow blocks also live in `flow` and can contain nested steps:

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

The graph reads this structure and turns it into operator nodes, branch edges, task nodes, and insertion points.

#### `outputs`

`outputs` defines the values returned by the workflow after execution completes.

```yaml
outputs:
  sent: "=$output.send_greeting.sent"
```

Use outputs when another workflow, API caller, or debugger needs a clear result shape.

### YAML Validation

The YAML editor validates several layers:

| Validation layer    | Examples                                                                             |
| ------------------- | ------------------------------------------------------------------------------------ |
| YAML syntax         | Invalid indentation, malformed lists, malformed objects.                             |
| Workflow schema     | Missing or invalid `defs`, `flow`, settings, expressions, or control-flow shapes.    |
| Task references     | A `do` step references a task that does not exist in `defs`.                         |
| Action references   | A task references an action that is not available for the workflow type.             |
| Action schemas      | Task `inputs` and action-specific `settings` do not match the action's JSON schemas. |
| Execution settings  | Task timeout and retry overrides do not match the shared execution settings schema.  |
| JSONata expressions | Expressions that start with `=` are parsed and reported when invalid.                |

If YAML does not validate, the editor can show markers in the YAML editor and may not be able to compile the graph. Save and publish actions depend on a valid workflow definition.

### Editing Guidance

Use graph view for structural changes:

* adding or deleting steps;
* inserting conditionals, loops, or parallel blocks;
* attaching bindings;
* configuring actions from generated forms.

Use YAML view for exact source changes:

* editing JSONata expressions;
* reviewing generated task IDs;
* making repetitive or copy-paste changes;
* inspecting `defaults`, nested branches, and final `outputs`;
* resolving validation errors with exact line context.

For most authoring flows, start in the graph, then use YAML for review and precise edits before saving or publishing.

### Minimal Example

This conversational workflow sends a response using the incoming text and exposes the action result as a workflow output:

```yaml
defaults:
  settings:
    timeout_ms: 10000
    retries:
      enabled: false
      max_attempts: 3
      backoff_ms: 25
      max_delay_ms: 10000
      jitter: 0
      multiplier: 1

defs:
  send_greeting:
    kind: task
    description: Send a greeting back to the subscriber.
    action: send_text_message
    inputs:
      text: "='Thanks for your message: ' & $input.text"
    settings:
      typing: true

flow:
  - do: send_greeting

outputs:
  sent: "=$output.send_greeting.sent"
```

In the graph, this appears as a single task node between the start and end indicators. In YAML, the same workflow is represented by one task definition in `defs`, one task step in `flow`, and one value in `outputs`.

### Related Pages

* Workflow Editor
* Actions, Tasks, and Steps
* Conditionals, Parallel Blocks, and Loops
* Workflow YAML Reference
* JSONata Expression Reference
