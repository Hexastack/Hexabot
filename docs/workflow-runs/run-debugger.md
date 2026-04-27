---
icon: bug
---

# Run Debugger

The run debugger shows execution history for one workflow and one initiator. Use it to compare runs, inspect step-level data, and rerun eligible manual or scheduled workflows.

<figure><img src="../.gitbook/assets/image (57).png" alt=""><figcaption></figcaption></figure>

You can open it from:

* the **Runs** list view action;
* dashboard **Recent Runs** and **Attention Required** widgets;
* the workflow editor bottom drawer while testing a workflow.

The standalone debugger page includes a back button to return to **Workflow Runs**. In the workflow editor, the debugger appears beside the chat tester or trigger simulator.

### Run Selection

When the debugger opens, it loads runs matching the current workflow and initiator, sorted newest first. The latest run is selected by default.

Use the run selector in the header to switch runs. Each run entry shows:

* run timestamp;
* workflow version chip when available;
* run status badge.

Switching runs resets the selected step so the inspector returns to run-level data.

### Workflow and Version Context

The header displays the workflow badge and the workflow version associated with the selected run. This matters when you compare runs before and after publishing a workflow change.

If a run was created from an older published version, the version chip helps you avoid debugging the current draft when the run actually used previous logic.

### Rerunning Workflows

The header shows a **Run** button only for manual and scheduled workflows.

<table><thead><tr><th width="144.91619873046875">Workflow type</th><th>How rerun works</th></tr></thead><tbody><tr><td>Conversational</td><td>Use the embedded chat tester in the workflow editor. The debugger does not show a Run button for conversational workflows.</td></tr><tr><td>Scheduled</td><td>The Run button starts the workflow immediately with the scheduled workflow trigger shape.</td></tr><tr><td>Manual</td><td>The Run button starts the workflow with the current trigger simulator input when the debugger is opened in the workflow editor. The input must satisfy the manual workflow input schema.</td></tr></tbody></table>

On the standalone debugger page, there is no trigger simulator next to the manual run button. Manual workflows with required input are usually easier to rerun from the workflow editor bottom drawer.

After a run starts successfully, the frontend refreshes workflow-run queries and shows the new run in the history.

### Debugging Flow

Use this sequence for most investigations:

1. Select the run you want to inspect. Start with the latest run unless you are comparing a known timestamp.
2. Confirm the workflow version in the header.
3. Check the run status and duration.
4. Scan the step trace for failed, suspended, skipped, or unusually slow steps.
5. Select a step to switch the inspector from run-level data to step-level data.
6. Review **Input**, **Context**, **Output**, and **Logs / Errors**.
7. If the workflow changed recently, switch to a previous run and compare the version, input, and failed step.
