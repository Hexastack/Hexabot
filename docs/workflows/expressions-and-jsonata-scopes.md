---
icon: function
---

# Expressions and JSONata Scopes

Expressions let a workflow compute values from the trigger input, runtime context, previous task output, and loop state. Hexabot uses [JSONata](https://jsonata.org/) for these expressions.

Any string that starts with `=` is evaluated as a JSONata expression. A string that does not start with `=` is treated as a literal value.

```yaml
defs:
  send_literal:
    kind: task
    action: send_text_message
    inputs:
      text: "Hello"

  send_dynamic:
    kind: task
    action: send_text_message
    inputs:
      text: "='You said: ' & $input.text"
```

In this example, `send_literal.inputs.text` is the literal string `Hello`, while `send_dynamic.inputs.text` is evaluated before the task runs.

For the JSONata language itself, use the [official JSONata documentation](https://docs.jsonata.org/overview.html). This page focuses on how JSONata is used inside Hexabot workflows.

### Where Expressions Are Used

Expressions are commonly used in:

| Location             | Example                                                   | Purpose                                           |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------- |
| Task inputs          | `text: "='Hello ' & $input.name"`                         | Build dynamic action inputs.                      |
| Conditional branches | `condition: "=$input.text = 'help'"`                      | Decide which branch runs.                         |
| Loop inputs          | `in: "=$input.items"`                                     | Choose the array a `for_each` loop iterates over. |
| Loop conditions      | `while: "=$not($exists($output.reply.text))"`             | Continue or stop a `while` loop.                  |
| Loop accumulators    | `merge: "=$append($accumulator, [$output.send_message])"` | Collect values across iterations.                 |
| Final outputs        | `result: "=$output.lookup_customer"`                      | Shape the workflow result.                        |

The editor's expression fields switch into JSONata mode when the value starts with `=`. In JSONata mode, the field highlights syntax problems and can suggest known workflow scopes such as `$input`, `$output`, and `$context`.

### Literal Values vs Expressions

The leading `=` is the important difference.

| YAML value                  | Meaning                                                |
| --------------------------- | ------------------------------------------------------ |
| `"Hello"`                   | Literal string.                                        |
| `"=$input.text"`            | Expression that returns the workflow input text.       |
| `"='Hello ' & $input.name"` | Expression that concatenates text with an input value. |
| `5`                         | Literal number.                                        |
| `true`                      | Literal boolean.                                       |
| `{ limit: 5 }`              | Literal object.                                        |

Quote expression strings in YAML when they contain punctuation, braces, regular expressions, or comparison operators. This avoids YAML parsing surprises and makes expressions easier to review.

### Available Scopes

Hexabot evaluates expressions with a set of workflow scopes.

| Scope               | Available where                        | What it contains                                                              |
| ------------------- | -------------------------------------- | ----------------------------------------------------------------------------- |
| `$input`            | Most workflow expressions              | The validated input payload for the run.                                      |
| `$context`          | Most workflow expressions              | Runtime metadata and state injected by Hexabot.                               |
| `$output.<task_id>` | After a task has run                   | Raw output returned by a task action.                                         |
| `$iteration`        | Inside loop steps and loop expressions | Current loop item and zero-based index.                                       |
| `$accumulator`      | Inside loops that use `accumulate`     | Current accumulator value before the merge expression returns the next value. |

Scopes are read-only from the expression's point of view. To change external state, use an action designed to write that state.

### `$input`

`$input` is the workflow trigger payload.

For conversational workflows, it includes message data such as `text` and `message`. For manual workflows, it follows the input schema defined by the workflow author. For scheduled workflows, it includes schedule metadata.

Examples:

```yaml
defs:
  send_echo:
    kind: task
    action: send_text_message
    inputs:
      text: "='You said: ' & $input.text"
```

```yaml
flow:
  - conditional:
      when:
        - condition: "=$contains($lowercase($input.text), 'pricing')"
          steps:
            - do: send_pricing
        - else: true
          steps:
            - do: send_default_reply
```

Useful patterns:

| Need                | Expression                                      |
| ------------------- | ----------------------------------------------- |
| Read incoming text  | `"=$input.text"`                                |
| Normalize text      | `"=$lowercase($trim($input.text))"`             |
| Check for a keyword | `"=$contains($lowercase($input.text), 'help')"` |
| Count input items   | `"=$count($input.items)"`                       |
| Filter open items   | `"=$input.items[status = 'open']"`              |

### `$context`

`$context` contains runtime metadata and state supplied by Hexabot. The editor can suggest common fields such as:

| Field                  | Meaning                                                                        |
| ---------------------- | ------------------------------------------------------------------------------ |
| `$context.initiatorId` | Identifier for the subscriber, user, schedule, or caller that started the run. |
| `$context.workflowId`  | Current workflow ID.                                                           |
| `$context.runId`       | Current workflow run ID.                                                       |
| `$context.memory`      | Loaded workflow memory values, keyed by memory slug when memory is mounted.    |

The exact context can vary by workflow type and runtime integration.

Examples:

```yaml
outputs:
  run_id: "=$context.runId"
  initiator: "=$context.initiatorId"
```

```yaml
defs:
  answer_with_memory:
    kind: task
    action: ai_generate_reply
    inputs:
      prompt: "='Known preference: ' & $string($context.memory.profile.preference) & '. User says: ' & $input.text"
```

Use `$context` for metadata and read-only state. Use task outputs when you need results produced during the current run.

### `$output.<task_id>`

Each task result is stored under `$output.<task_id>`.

```yaml
defs:
  lookup_customer:
    kind: task
    action: http_request
    inputs:
      url: "='https://example.com/customers/' & $input.customer_id"

  send_status:
    kind: task
    action: send_text_message
    inputs:
      text: "='Customer status: ' & $output.lookup_customer.body.status"

flow:
  - do: lookup_customer
  - do: send_status
```

Only read outputs from tasks that have already run on the current path. This is especially important with conditionals and `wait_any` parallel blocks.

Safe output checks:

```yaml
flow:
  - conditional:
      when:
        - condition: "=$exists($output.lookup_customer.body.status)"
          steps:
            - do: send_status
        - else: true
          steps:
            - do: ask_for_customer_id
```

Useful patterns:

| Need                     | Expression                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| Check whether a task ran | `"=$exists($output.lookup_customer)"`                                                               |
| Read a nested result     | `"=$output.lookup_customer.body.status"`                                                            |
| Fallback value           | `"=$exists($output.lookup_customer.body.status) ? $output.lookup_customer.body.status : 'unknown'"` |
| Build a final output     | `"={'status': $output.lookup_customer.body.status, 'run_id': $context.runId}"`                      |

### `$iteration`

`$iteration` is available inside loop bodies and loop-related expressions.

| Field              | Meaning                            |
| ------------------ | ---------------------------------- |
| `$iteration.item`  | Current item in a `for_each` loop. |
| `$iteration.index` | Zero-based iteration index.        |

Example:

```yaml
defs:
  send_item:
    kind: task
    action: send_text_message
    inputs:
      text: "='Item #' & ($iteration.index + 1) & ': ' & $iteration.item.name"

flow:
  - loop:
      type: for_each
      for_each:
        item: item
        in: "=$input.items"
      steps:
        - do: send_item
```

Use `$iteration` only inside the loop. Outside the loop, it is not available.

### `$accumulator`

`$accumulator` is available when a loop defines `accumulate`. It holds the current accumulated value. The merge expression returns the next accumulated value.

```yaml
flow:
  - loop:
      type: for_each
      name: processed_items
      for_each:
        item: item
        in: "=$input.items"
      accumulate:
        as: names
        initial: []
        merge: "=$append($accumulator, [$iteration.item.name])"
      steps:
        - do: process_item

outputs:
  names: "=$output.processed_items.names"
```

Common accumulator shapes:

| Goal                  | Initial value | Merge expression                                   |
| --------------------- | ------------- | -------------------------------------------------- |
| Count iterations      | `0`           | `"=$accumulator + 1"`                              |
| Collect task results  | `[]`          | `"=$append($accumulator, [$output.process_item])"` |
| Collect current items | `[]`          | `"=$append($accumulator, [$iteration.item])"`      |
| Keep latest value     | `null`        | `"=$output.process_item"`                          |

If you want to expose the accumulator as a workflow output, give the loop a `name` and read `$output.<loop_name>.<accumulator_name>`.

### Practical JSONata Examples

#### Text Formatting

```yaml
text: "='Thanks for your message: ' & $input.text"
```

```yaml
text: "='Order ' & $input.order_id & ' is ' & $output.lookup_order.status"
```

#### Boolean Conditions

```yaml
condition: "=$input.text = 'help'"
```

```yaml
condition: "=$contains($lowercase($input.text), 'refund')"
```

```yaml
condition: "=$exists($output.lookup_customer.body.id)"
```

#### Regular Expression Matching

This example checks whether a reply contains exactly eight digits:

```yaml
condition: "=$exists($match($trim($output.await_phone_reply.text), /^\\d{8}$/))"
```

The same pattern can be used in a `while` loop to keep asking until a valid value is received:

```yaml
while: "=$not($exists($output.await_phone_reply.text) and $exists($match($trim($output.await_phone_reply.text), /^\\d{8}$/)))"
```

#### Arrays

```yaml
in: "=$input.recipients"
```

```yaml
condition: "=$count($input.items[status = 'open']) > 0"
```

```yaml
merge: "=$append($accumulator, [$iteration.item])"
```

#### Objects

```yaml
outputs:
  result: "={'customer_id': $input.customer_id, 'status': $output.lookup_customer.body.status, 'run_id': $context.runId}"
```

For larger objects, use YAML block style to keep the expression readable:

```yaml
outputs:
  result: >-
    ={
      'customer_id': $input.customer_id,
      'status': $output.lookup_customer.body.status,
      'run_id': $context.runId
    }
```

### Authoring Tips

* Start dynamic values with `=`.
* Keep literal text as normal strings without `=`.
* Prefer clear task IDs because they become `$output.<task_id>` paths.
* Use `$exists(...)` before reading optional task output.
* Use the graph editor for branch and loop structure, then review expressions in YAML.
* Quote expressions in YAML unless the expression is very simple.
* Keep complex expressions small. If an expression becomes hard to review, move the work into a task.

### Troubleshooting

| Problem                                             | Likely cause                                                | Fix                                                                           |
| --------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Value is sent literally, such as `$input.text`      | Missing leading `=`.                                        | Use `"=$input.text"`.                                                         |
| Editor reports invalid JSONata                      | Syntax error after the leading `=`.                         | Check quotes, parentheses, and function calls.                                |
| Output path is empty                                | The task has not run on this path, or the task ID is wrong. | Check `flow`, branch logic, and task ID spelling.                             |
| Expression works in one branch but fails in another | A referenced output is branch-specific.                     | Guard with `$exists(...)` or move the dependent step into the same branch.    |
| Loop expression cannot read `$iteration`            | The expression is outside the loop.                         | Use `$iteration` only inside loop steps, `until`, or accumulator expressions. |

### Related Pages

* Actions, Tasks, and Steps
* Conditionals, Parallel Blocks, and Loops
* Workflow Types
* JSONata Expression Reference
* [Official JSONata Documentation](https://docs.jsonata.org/overview.html)
