---
icon: diagram-sankey
---

# Conditionals, Parallels, and Loops

Conditionals, parallel blocks, and loops let a workflow do more than run tasks from top to bottom. They are inserted from the graph add menu alongside normal task steps, and each one appears as an operator node on the canvas.

<figure><img src="../.gitbook/assets/image (42).png" alt=""><figcaption></figcaption></figure>

Use them when the workflow needs to choose a path, fan out independent work, or repeat work over a collection or condition.

| Operator    | Use it when                                                                  | Main YAML key |
| ----------- | ---------------------------------------------------------------------------- | ------------- |
| Conditional | The workflow should choose one branch based on data or previous task output. | `conditional` |
| Parallel    | Several independent branches should be started as one block.                 | `parallel`    |
| Loop        | The workflow should repeat nested steps.                                     | `loop`        |

### In the Graph Editor

Click an add button on the graph, then choose one of the control-flow options:

* **Conditional** adds a branching operator.
* **Loop** adds a repeat operator.
* **Parallel** adds a fan-out operator.

Selecting an operator node opens its configuration drawer:

<table><thead><tr><th width="131.82672119140625">Operator</th><th>Drawer controls</th></tr></thead><tbody><tr><td>Conditional</td><td>JSONata conditions and add/remove condition buttons.</td></tr><tr><td>Parallel</td><td>Completion strategy: <code>wait_all</code> or <code>wait_any</code>.</td></tr><tr><td>Loop</td><td>Loop type, iteration expression, while condition, early stop rule, max concurrency, and accumulator settings.</td></tr></tbody></table>

The graph shows empty insertion points inside branches and loop bodies. Adding a task or another operator at one of those points updates the nested `steps` array in YAML.

### Conditionals

A conditional chooses one branch from a list of branches. Each condition is a JSONata expression and must start with `=`.

<figure><img src="../.gitbook/assets/image (46).png" alt=""><figcaption></figcaption></figure>

When the editor inserts a new conditional, it creates one placeholder condition and an `else` branch:

```yaml
flow:
  - conditional:
      when:
        - condition: "=false"
          steps: []
        - else: true
          steps: []
```

Select the conditional node to edit its conditions. The drawer lets you add conditions, remove conditions, and save the updated branch list. The editor keeps an `else` branch so the workflow has a fallback path when no condition matches.

#### How Conditions Run

Conditions are evaluated in order. The first truthy condition wins. If no condition is truthy, the `else` branch runs when it exists.

<figure><img src="../.gitbook/assets/image (47).png" alt=""><figcaption></figcaption></figure>

```yaml
flow:
  - conditional:
      when:
        - condition: "=$input.text = 'help'"
          steps:
            - do: send_help
        - condition: "=$contains($lowercase($input.text), 'price')"
          steps:
            - do: send_pricing
        - else: true
          steps:
            - do: send_fallback
```

In the graph, each conditional branch is shown as an outgoing path from the conditional operator. Branch labels are based on the condition expression, with the fallback branch shown as the else branch.

#### Conditional Authoring Tips

* Put the most specific conditions first.
* Keep conditions boolean and easy to read.
* Use `$exists($output.task_id)` before reading output that may not be present.
* Keep an `else` branch for fallback handling.
* Put branch-specific tasks inside the branch `steps` array.

### Parallel Blocks

<figure><img src="../.gitbook/assets/image (49).png" alt=""><figcaption></figcaption></figure>

A parallel block groups independent branches. It is useful when several tasks can be started without depending on each other, such as fetching context from multiple systems or preparing several enrichment results before a later step.

When the editor inserts a new parallel block, it uses `wait_all` by default:

```yaml
flow:
  - parallel:
      strategy: wait_all
      steps: []
```

Add steps inside the parallel block from the graph. In YAML, each item in `parallel.steps` is a sibling branch:

```yaml
flow:
  - parallel:
      strategy: wait_all
      steps:
        - do: fetch_customer
        - do: fetch_latest_orders
        - do: fetch_open_tickets
  - do: summarize_context
```

The `summarize_context` step runs after the parallel block completes according to the selected strategy.

#### Completion Strategy

Select the parallel node to choose how the workflow should continue:

| Strategy   | Meaning                                    | Use it when                                                              |
| ---------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| `wait_all` | Continue after every branch has completed. | Later steps need outputs from all branches.                              |
| `wait_any` | Continue as soon as one branch completes.  | Later steps only need the first available result or one successful path. |

With `wait_any`, do not assume every branch produced output. Downstream expressions should check for the output they need:

```yaml
flow:
  - parallel:
      strategy: wait_any
      steps:
        - do: lookup_by_email
        - do: lookup_by_phone
  - conditional:
      when:
        - condition: "=$exists($output.lookup_by_email)"
          steps:
            - do: use_email_result
        - condition: "=$exists($output.lookup_by_phone)"
          steps:
            - do: use_phone_result
        - else: true
          steps:
            - do: ask_for_more_information
```

#### Parallel Authoring Tips

* Use parallel blocks for independent work.
* Avoid branches that depend on each other's output.
* Avoid multiple branches writing to the same external record unless the actions are designed for that.
* Prefer `wait_all` when the next step reads several branch outputs.
* Prefer `wait_any` only when later logic can handle partial output.

### Loops

<figure><img src="../.gitbook/assets/image (50).png" alt=""><figcaption></figcaption></figure>

A loop repeats nested steps. Hexabot supports two loop types:

| Loop type  | Meaning                                                                                | Typical use                                                                                    |
| ---------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `for_each` | Iterate over each item returned by an expression.                                      | Send one message per item, process a list, update several records.                             |
| `while`    | Repeat while a condition remains true. The condition is checked before each iteration. | Ask for missing information, poll until a condition changes, retry a workflow-level operation. |

When the editor inserts a new loop, it creates an empty `for_each` loop:

```yaml
flow:
  - loop:
      type: for_each
      for_each:
        item: item
        in: "=[]"
      steps: []
```

Select the loop node to configure the loop type and its fields.

### For Each Loops

A `for_each` loop evaluates an expression and iterates over the resulting array.

```yaml
flow:
  - loop:
      type: for_each
      for_each:
        item: item
        in: "=$input.recipients"
      steps:
        - do: send_notification
```

Inside the loop body, expressions can read:

| Scope               | Meaning                                   |
| ------------------- | ----------------------------------------- |
| `$iteration.item`   | The current item.                         |
| `$iteration.index`  | The zero-based index of the current item. |
| `$output.<task_id>` | Outputs from tasks that have already run. |

For example, a task inside the loop can use the current item:

```yaml
defs:
  send_notification:
    kind: task
    action: send_text_message
    inputs:
      text: "='Hello ' & $iteration.item.name"

flow:
  - loop:
      type: for_each
      for_each:
        item: item
        in: "=$input.recipients"
      steps:
        - do: send_notification
```

#### For Each Settings

| Field             | Required | Purpose                                                                               |
| ----------------- | -------- | ------------------------------------------------------------------------------------- |
| `for_each.item`   | Yes      | Names the loop item in YAML. The current value is available as `$iteration.item`.     |
| `for_each.in`     | Yes      | JSONata expression that returns the array to iterate over.                            |
| `max_concurrency` | No       | Positive integer concurrency hint for processing a large collection.                  |
| `until`           | No       | JSONata expression checked after each iteration. If it is true, the loop stops early. |

Use `until` when a loop can stop after a result is found:

```yaml
flow:
  - loop:
      type: for_each
      for_each:
        item: item
        in: "=$input.candidates"
      until: "=$exists($output.check_candidate.accepted) and $output.check_candidate.accepted"
      steps:
        - do: check_candidate
```

### While Loops

A `while` loop evaluates its condition before each iteration. If the condition is false at the start, the loop body does not run.

```yaml
flow:
  - loop:
      type: while
      while: "=$not($exists($output.await_phone_reply.text))"
      steps:
        - do: ask_for_phone_number
        - do: await_phone_reply
```

Use while loops carefully. The condition must eventually become false, usually because a task inside the loop produces output that changes the condition.

Inside a while loop, `$iteration.index` is available. `$iteration.item` is not tied to a collection item because the loop is condition-based.

### Accumulators

Loops can maintain an accumulator. An accumulator is useful when each iteration produces a value and the workflow should collect or reduce those values.

In the loop drawer, enable the accumulator and configure:

| Field            | Meaning                                                           |
| ---------------- | ----------------------------------------------------------------- |
| Accumulator name | Output key for the accumulated value.                             |
| Initial value    | Starting value as valid JSON, such as `[]`, `{}`, `0`, or `null`. |
| Merge expression | JSONata expression that returns the next accumulator value.       |

The merge expression can read `$accumulator`, `$iteration`, and task outputs from the current iteration.

```yaml
flow:
  - loop:
      type: for_each
      name: delivery_loop
      for_each:
        item: item
        in: "=$input.recipients"
      accumulate:
        as: sent_messages
        initial: []
        merge: "=$append($accumulator, [$output.send_notification])"
      steps:
        - do: send_notification

outputs:
  sent_messages: "=$output.delivery_loop.sent_messages"
```

The loop `name` is needed when you want to expose the accumulated value through `$output.<loop_name>.<accumulator_name>`. If you configure the accumulator in the graph drawer and need a named loop output, review the YAML and add a loop `name`.

### Nesting

Control-flow blocks can be nested:

* conditionals can contain task steps, loops, parallel blocks, or other conditionals;
* loop bodies can contain task steps and other operators;
* parallel block branches can contain task steps or operators.

Use nesting when it makes the workflow easier to read. If a graph becomes hard to scan, split responsibilities into clearer tasks or move repeated logic into a separate workflow pattern.
