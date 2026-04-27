---
icon: magnifying-glass-waveform
---

# Step Trace and Inspector

The run debugger uses the step trace and inspector together. The step trace shows what happened during execution. The inspector shows the data captured for the selected run or selected step.

### Step Trace

The step trace panel lists step execution records from the selected run snapshot. Each item can show:

<table><thead><tr><th width="141.4503173828125">Field</th><th>Meaning</th></tr></thead><tbody><tr><td>Step name</td><td>The workflow step or task name.</td></tr><tr><td>Action group</td><td>Action group badge when the action definition is available.</td></tr><tr><td>Status</td><td>Step status icon and tooltip.</td></tr><tr><td>Reason</td><td>Optional explanation, often useful for skipped or suspended steps.</td></tr><tr><td>Duration</td><td>Step duration in milliseconds when timing data is available.</td></tr></tbody></table>

Select a step to inspect it. Select it again to return the inspector to run-level data.

### Trace Filters

The trace toolbar includes:

<table><thead><tr><th width="182.0682373046875">Control</th><th>Use it for</th></tr></thead><tbody><tr><td>Executed only</td><td>Hide skipped steps so the list focuses on work that actually ran.</td></tr><tr><td>Include skipped</td><td>Show all captured steps, including branches that were bypassed.</td></tr><tr><td>Search</td><td>Filter steps by step name, action name, reason, or status.</td></tr></tbody></table>

Filtering the trace does not change the selected run. If the selected step is hidden by filters, clear the search or include skipped steps to find it again.

### Step Statuses

<table><thead><tr><th width="136.780517578125">Status</th><th>Meaning</th></tr></thead><tbody><tr><td>Pending</td><td>The step exists but has not run in the latest snapshot.</td></tr><tr><td>Running</td><td>The step started and has not reached a final state.</td></tr><tr><td>Suspended</td><td>The step paused execution and is waiting for resume data.</td></tr><tr><td>Completed</td><td>The step resolved successfully.</td></tr><tr><td>Failed</td><td>The step threw an error.</td></tr><tr><td>Skipped</td><td>Control flow bypassed the step.</td></tr></tbody></table>

Skipped steps are normal in conditional branches and some parallel strategies. A skipped step is only a problem if the branch should have run.

### Inspector Tabs

The inspector has the same tabs for run-level and step-level inspection.

<table><thead><tr><th width="133.59869384765625">Tab</th><th>Run selected</th><th>Step selected</th></tr></thead><tbody><tr><td>Overview</td><td>Status, trigger time, initiator, duration, data summaries, and error summary.</td><td>Step name, step status, duration, data summaries, and error summary.</td></tr><tr><td>Input</td><td>Full workflow input payload.</td><td>Evaluated input passed to the selected action.</td></tr><tr><td>Context</td><td>Workflow context after execution or latest persisted state.</td><td>Context before and after the selected step when captured.</td></tr><tr><td>Output</td><td>Final workflow output or latest persisted output.</td><td>Output returned by the selected action.</td></tr><tr><td>Logs / Errors</td><td>Run error message or error object.</td><td>Step error message and stack when captured.</td></tr></tbody></table>

JSON tabs use a structured viewer. Empty values appear as `null`, `none`, or an empty object depending on the captured field.

### Data Summary

The overview tab summarizes data before you open the JSON tabs:

<table><thead><tr><th width="154.45458984375">Summary</th><th>Meaning</th></tr></thead><tbody><tr><td><code>none</code></td><td>No value was captured.</td></tr><tr><td><code>N fields</code></td><td>The value is an object with <code>N</code> top-level fields.</td></tr><tr><td><code>N items</code></td><td>The value is an array with <code>N</code> entries.</td></tr><tr><td><code>yes</code></td><td>A primitive value or non-empty error exists.</td></tr></tbody></table>

Use summaries to decide which JSON tab to open first. For example, a failed step with input fields and no output usually failed during the action call, while a finished run with output fields can be checked from the output tab.

### Investigation Patterns

<table><thead><tr><th width="301.635009765625">Symptom</th><th>What to inspect</th></tr></thead><tbody><tr><td>Run failed</td><td>Select the failed step, then open <strong>Logs / Errors</strong> and compare the action input with the expected schema.</td></tr><tr><td>Run suspended</td><td>Select the suspended step, check the reason and context, then confirm the awaited event can resume the run.</td></tr><tr><td>Wrong branch ran</td><td>Include skipped steps, compare skipped and completed branches, then inspect the condition inputs in context.</td></tr><tr><td>Output is missing</td><td>Check whether the final run output is empty, then inspect the last completed step output.</td></tr><tr><td>Action received unexpected data</td><td>Select the step and compare <strong>Input</strong> with run-level <strong>Input</strong> and <strong>Context</strong>.</td></tr><tr><td>Behavior changed after publishing</td><td>Switch runs in the debugger header and compare workflow version chips plus step outputs.</td></tr></tbody></table>

### Snapshot Availability

The trace depends on persisted `stepLog` data. If a run has no snapshot data yet, the trace shows an empty state. This can happen while a run is still being created, when a failure occurs before step execution begins, or when inspecting old records created before step traces were stored.
