---
icon: circle-check
---

# Run Statuses and Filters

Run statuses identify where a workflow execution is in its lifecycle. They appear in the runs list, dashboard widgets, and the run debugger header.

### Run Statuses

Workflow runs use these statuses:

<table><thead><tr><th width="129.5574951171875">Status</th><th>Meaning</th><th>Typical next step</th></tr></thead><tbody><tr><td><code>idle</code></td><td>A run or runner snapshot exists, but execution has not started yet. This is usually temporary.</td><td>Refresh the runs list. If it remains idle, check backend logs for startup or trigger errors.</td></tr><tr><td><code>running</code></td><td>The workflow is currently executing.</td><td>Wait for completion or open the debugger to watch the latest persisted trace.</td></tr><tr><td><code>suspended</code></td><td>A step paused the workflow and is waiting to resume.</td><td>Inspect the suspended step, reason, and context. Confirm the expected reply, callback, or resume event can arrive.</td></tr><tr><td><code>finished</code></td><td>All workflow steps completed and final outputs were evaluated successfully.</td><td>Use the output tab to confirm the returned data.</td></tr><tr><td><code>failed</code></td><td>A step or continuation threw an uncaught error and the run was marked failed.</td><td>Open the debugger, select the failed step, and inspect the error plus input/context values.</td></tr></tbody></table>

`pending`, `completed`, and `skipped` are step statuses, not run statuses. They appear inside the step trace for individual workflow steps.

### Step Statuses

The debugger's step trace can show:

<table><thead><tr><th width="148.094482421875">Step status</th><th>Meaning</th></tr></thead><tbody><tr><td><code>pending</code></td><td>The step exists in the execution plan but has not run yet.</td></tr><tr><td><code>running</code></td><td>The step started and has not reached a final state in the latest snapshot.</td></tr><tr><td><code>suspended</code></td><td>The step paused execution through a suspension point.</td></tr><tr><td><code>completed</code></td><td>The action resolved successfully.</td></tr><tr><td><code>failed</code></td><td>The action threw an error.</td></tr><tr><td><code>skipped</code></td><td>Control flow bypassed the step, for example through a conditional branch or a parallel <code>wait_any</code> outcome.</td></tr></tbody></table>

### Filter Reference

The runs list combines text search with exact-match filters.

<table><thead><tr><th width="140.0582275390625">Control</th><th width="157.8900146484375">URL parameter</th><th>Matches</th></tr></thead><tbody><tr><td>Search</td><td><code>search</code></td><td>Status and error fields using contains-style matching.</td></tr><tr><td>Workflow</td><td><code>name</code></td><td>Workflow name.</td></tr><tr><td>Subscribers</td><td><code>subscriber</code></td><td>Triggered-by identifier.</td></tr><tr><td>Type</td><td><code>type</code></td><td>Workflow type: <code>conversational</code>, <code>scheduled</code>, or <code>manual</code>.</td></tr><tr><td>Status</td><td><code>status</code></td><td>Run status: <code>idle</code>, <code>running</code>, <code>suspended</code>, <code>finished</code>, or <code>failed</code>.</td></tr></tbody></table>

Because filters are synced to the URL, you can bookmark views such as failed runs or manual workflow runs.

### Useful Filter Combinations

<table><thead><tr><th width="346.8089599609375">Situation</th><th>Filters</th></tr></thead><tbody><tr><td>Latest production failures</td><td><code>Status = failed</code>, then search for a repeated error message.</td></tr><tr><td>A workflow is stuck waiting</td><td><code>Status = suspended</code>, optionally filter by workflow.</td></tr><tr><td>A scheduled job did not complete</td><td><code>Type = scheduled</code>, filter by workflow, then compare trigger times.</td></tr><tr><td>A manual run failed validation or action execution</td><td><code>Type = manual</code>, filter by workflow or initiator, then open the debugger.</td></tr><tr><td>A subscriber reports a bad conversation</td><td>Filter by subscriber and workflow, then inspect the selected run history.</td></tr></tbody></table>

### Reading Duration

Duration is derived from run timestamps:

* finished runs use the finish time;
* failed runs use the failure time;
* suspended runs use the suspension time;
* running runs use the current time when the data is parsed or refreshed;
* idle runs may not have enough data to show a duration.

Use duration as an operational clue, not as a complete performance profile. For step-level timing, open the debugger and review the trace.
