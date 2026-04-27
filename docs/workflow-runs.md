---
icon: wave-pulse
---

# Workflow Runs

The workflow runs page is the execution history for workflows. Open it from **Workflows > Runs** in the sidebar or by going to `/workflow/runs`.

<figure><img src=".gitbook/assets/image (56).png" alt=""><figcaption></figcaption></figure>

Use it when you need to confirm that a workflow ran, investigate a failure, compare recent executions, or jump into the run debugger.

### What a Run Represents

A workflow run is one execution attempt for one workflow version. Runs are created by:

| Workflow type  | What starts the run                                 |
| -------------- | --------------------------------------------------- |
| Conversational | An incoming chat or channel event.                  |
| Scheduled      | The workflow schedule or a manual "run now" action. |
| Manual         | An admin/API trigger with a manual input payload.   |

Each run can store the workflow, workflow version, initiator, input, context, output, step trace, status, duration, timestamps, and error details.

### Table Columns

The workflow and triggered-by fields depend on related records still being available. If an old relation was removed, the table may show an empty or unknown value for that part of the row.

### Searching

The text search box searches run status and error text. It is useful for broad checks such as:

* `failed`
* `suspended`
* part of an error message
* a repeated exception name

Search state is kept in the URL so you can share or reopen filtered views. Use structured filters for workflow names, workflow types, and initiators because the free-text search does not search every displayed column.

### Structured Filters

The filter controls narrow the table with exact matches.

| Filter      | Use it for                                                                        |
| ----------- | --------------------------------------------------------------------------------- |
| Workflow    | Isolating runs for one workflow. The picker shows workflow names and type badges. |
| Subscribers | Finding runs triggered by one subscriber or initiator profile.                    |
| Type        | Showing conversational, scheduled, or manual workflow runs.                       |
| Status      | Showing runs in a specific lifecycle state, such as failed or suspended.          |

The status and type filters include an **All** option. Selecting **All** clears that filter.

Dashboard shortcuts can pre-filter this page. For example, **View Failed Runs** opens the runs table with the failed status already selected.

### Opening a Run

Select the view action in the **Operations** column to open the run debugger. The debugger URL is scoped to the workflow and the initiator:

```
/workflow/:workflowId/runs/:initiatorId
```

This means the debugger opens the execution history for that workflow and initiator, not only the single table row you clicked. The latest run is selected first. Use the run history menu in the debugger to inspect older runs from the same workflow and initiator.

### Common Workflows

| Goal                                     | Recommended path                                                                                                      |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Investigate failed automation            | Filter `Status` to failed, open the run, select the failed step, then inspect input, context, output, and error tabs. |
| Check whether a manual run started       | Filter by workflow type `manual`, then search or sort by trigger time.                                                |
| Review scheduled executions              | Filter by workflow type `scheduled`, then compare trigger times and durations.                                        |
| Find suspended conversations             | Filter `Status` to suspended and open the debugger to see where the run paused.                                       |
| Compare behavior after a workflow change | Filter by workflow, open the debugger, and compare runs by version chip and timestamp.                                |
