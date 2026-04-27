---
icon: chart-line
---

# Dashboard

The dashboard summarizes system activity and operational health. Depending on permissions, it can show KPI cards, quick actions, latest workflows, recent runs, upcoming schedules, thread activity, failed runs, integration health, and recent audit activity.

<figure><img src=".gitbook/assets/image (2) (1).png" alt=""><figcaption></figcaption></figure>

It is the first page in the admin panel and is designed as an operational starting point: authors can jump back into workflow building, operators can investigate failed runs, and administrators can check whether channels and recent activity look healthy.

### What Appears on the Dashboard

Dashboard content is permission-aware. A user only sees widgets backed by entities they can read. For example, a user without workflow-run access will not see recent runs or failed-run alerts.

If none of the widgets are available for the current user's permissions, the dashboard shows an empty state instead of partial or unauthorized data.

| Area                | Purpose                                                    | Main permissions                     |
| ------------------- | ---------------------------------------------------------- | ------------------------------------ |
| KPI cards           | High-level counts and recent performance.                  | Stats plus related entity access.    |
| Quick actions       | Shortcuts to common setup and operations pages.            | Permissions required by each action. |
| Latest workflows    | Recently created workflows.                                | Workflow read access.                |
| Attention Required  | Failed workflow runs from the last 24 hours.               | Stats and workflow-run read access.  |
| Recent runs         | Latest workflow executions.                                | Workflow-run read access.            |
| Upcoming schedules  | Scheduled workflows ordered by next run time.              | Workflow read access.                |
| Thread Snapshot     | Conversation volume and handoff trend for the last 7 days. | Stats and thread read access.        |
| Integrations Health | Health of configured channel sources.                      | Stats and source read access.        |
| Activity            | Latest audit-log events.                                   | Audit-log read access.               |

### KPI Cards

The top KPI row gives a quick health summary.

| KPI             | Meaning                                               |
| --------------- | ----------------------------------------------------- |
| Total Workflows | Number of workflows in the workspace.                 |
| Total Runs      | Workflow runs from the last 24 hours.                 |
| Success Rate    | Successful workflow-run ratio from the last 24 hours. |
| Messages        | Messages from the last 24 hours.                      |

The KPI row only includes metrics the user is allowed to see. Values show a loading placeholder until the stats summary is available.

### Quick Actions

Quick actions are shortcuts for frequent tasks:

| Action              | Opens                                 | Use it for                                                                     |
| ------------------- | ------------------------------------- | ------------------------------------------------------------------------------ |
| Create Workflow     | Workflow Builder                      | Creating or editing workflows.                                                 |
| Run Manual Workflow | Workflow Builder                      | Opening the workflow area to run a manual workflow from the trigger simulator. |
| Channels            | Channels and Sources                  | Connecting or configuring a channel source.                                    |
| View Failed Runs    | Workflow Runs filtered to failed runs | Investigating workflow failures.                                               |

Each shortcut appears only when the user has the required permissions.

### Latest Workflows

The latest workflows widget shows up to three recently created workflows. Each card shows the workflow name and type. Clicking a card opens the workflow directly in the workflow editor.

Use this widget to resume recent authoring work or quickly confirm that newly created workflows are available. If there are no workflows yet, users with workflow creation access can create one from the widget.

### Attention Required

Attention Required focuses on failed workflow runs from the last 24 hours. It shows:

* the number of failures in the last 24 hours;
* up to three recent failed runs;
* the workflow name;
* the error message when available;
* the failure time;
* a link to inspect the run in the debugger.

If there are more failures than the widget displays, the **View more** action opens the workflow runs page filtered to failed runs. This widget refreshes periodically while the dashboard is open.

When there are no failed runs, the widget shows an all-systems-operational state.

### Recent Runs

Recent runs shows the latest workflow executions across workflow types. Each row includes:

* workflow name and type badge;
* run time;
* duration;
* run status;
* a view action that opens the run debugger when the workflow and initiator are available.

Use this widget to spot recent activity and jump into execution details without first opening the full runs table.

### Upcoming Schedules

Upcoming schedules lists scheduled workflows and orders them by next run time. Each item shows:

* workflow name;
* workflow type icon;
* remaining time before the next run;
* formatted cron schedule;
* optional workflow description.

Clicking an item opens the workflow in the editor. The **View all** action opens the workflow builder.

### Thread Snapshot

Thread Snapshot is a 7-day bar chart for conversation activity. It currently tracks:

| Series      | Meaning                                                            |
| ----------- | ------------------------------------------------------------------ |
| New Threads | New conversation threads created during the period.                |
| Handoffs    | Conversations handed off from automation to a human/operator flow. |

Use this chart to understand traffic patterns and whether handoffs are increasing. The widget refreshes periodically while the dashboard is open.

### Integrations Health

Integrations Health summarizes channel source health. Each integration card shows:

* source or integration name;
* last checked time;
* health status;
* optional status message.

Possible statuses are:

| Status          | Meaning                                                |
| --------------- | ------------------------------------------------------ |
| Healthy         | The integration is enabled and reporting normally.     |
| Action Required | The integration has a warning that should be reviewed. |
| Unhealthy       | The integration is failing or unavailable.             |
| Disabled        | The integration is configured but disabled.            |

Use this widget after adding channels or when messages stop arriving. If no integrations are configured, the dashboard prompts users to connect a channel source.

### Activity

The Activity timeline shows the latest audit events. Each event includes:

* operation status;
* operation type and resource type;
* actor;
* target resource when different from the actor;
* event time.

Use this widget to understand recent administrative activity, then open the audit trail for full request metadata, before/after data, and raw event details.

### Empty, Loading, and Error States

Dashboard widgets handle missing data independently. A single widget can show a loading, empty, or error state without blocking the rest of the dashboard.

Common examples:

* no workflows: Latest Workflows offers a create action when permitted;
* no failed runs: Attention Required shows an all-systems-operational message;
* no scheduled workflows: Upcoming Schedules explains that schedules appear after configuration;
* no channel sources: Integrations Health prompts users to connect a source;
* unavailable stats or audit data: the affected widget shows an error state and points users toward the relevant detail page.
