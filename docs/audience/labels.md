---
description: >-
  Create and manage audience labels for segmentation, routing, and workflow
  state.
icon: tags
---

# Labels

Labels are audience tags that can be assigned to subscribers. They give operators and workflows a shared vocabulary for segmentation, routing, follow-up, and reporting.

Open labels from **Audience > Labels** or by going to `/subscribers/labels`.

### What Labels Are For

Use labels to mark subscriber state that should be visible outside a single conversation.

Common examples include:

| Label type     | Examples                                                  |
| -------------- | --------------------------------------------------------- |
| Lifecycle      | New lead, qualified lead, customer, churn risk.           |
| Support status | Needs follow-up, waiting for documents, escalated.        |
| Interests      | Product A, enterprise plan, billing, delivery.            |
| Eligibility    | Beta user, VIP, blocked, consent granted.                 |
| Workflow state | Survey completed, onboarding started, handover requested. |

Labels are more durable than one-off workflow variables. Use them when the value should remain attached to the subscriber profile and be available to operators or later workflows.

### Labels List

The labels table shows:

| Column      | Meaning                                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| Title       | Human-readable label shown in selectors and subscriber label chips.                                                    |
| Group Label | Optional group that organizes the label and makes grouped labels mutually exclusive in subscriber assignment controls. |
| Name        | Generated technical name used by automation and API payloads.                                                          |
| Description | Optional explanation for admins and maintainers.                                                                       |
| Label ID    | External channel label mapping, when a channel stores provider-specific label identifiers.                             |
| Created At  | Date and time the label was created.                                                                                   |
| Updated At  | Date and time the label was last changed.                                                                              |
| Operations  | Edit and delete actions, depending on permissions.                                                                     |

The internal label ID exists in the table data but is hidden by default.

### Searching

Use the search box to filter labels by **Name** or **Title**. Search state is synchronized with the URL.

Use search when you need to:

* find the canonical label before assigning it to a subscriber;
* review labels with similar names;
* confirm whether a new label already exists before creating another one.

Search does not currently target descriptions or group names.

### Create a Label

1. Open **Audience > Labels**.
2. Click **Add**.
3. Enter a required **Title**.
4. Choose an existing **Group Label**, create a group inline, or leave the label without a group.
5. Add a **Description** when the label's purpose is not obvious.
6. Click **Submit**.

The frontend generates **Name** from the title. It trims surrounding spaces, removes unsupported characters, converts spaces and repeated dashes to underscores, and stores the result in uppercase. For example, `High Priority Lead` becomes `HIGH_PRIORITY_LEAD`.

The generated name is shown as a disabled field because it is derived from **Title**. Treat it as a stable automation value after the label is in use.

### Edit a Label

Use **Edit** from the **Operations** column. The edit dialog lets you change the title, group, and description. If you change the title, the generated name is recalculated from that title.

Before editing a label that is already in use, consider where it appears:

* subscriber label chips;
* subscriber filters;
* workflow actions that assign or remove labels;
* workflow expressions or downstream systems that reference the generated name;
* operator procedures that use the title.

Changing the title updates what admins see and may also change the generated name. Changing the generated name can affect automation that expects the previous value.

### Delete Labels

Use **Delete** in the row operations column to delete one label. To delete several labels, select rows with the table checkboxes and click the top **Delete** button.

The frontend asks for confirmation before deleting.

Delete a label only when it should no longer exist. Removing a label can affect subscriber segmentation and any workflow that expects that label to be available. If a label is temporarily unused, consider keeping it and updating the description instead.

### Label Groups

The **Group Label** field is optional. It controls how labels are organized in subscriber management.

When labels belong to the same group, subscriber label selectors treat them as mutually exclusive: a subscriber can have one active label from that group at a time. This is useful for categories where only one value should be true, such as:

* lifecycle stage;
* priority level;
* qualification status;
* preferred language bucket;
* region or routing tier.

Labels without a group appear under **Default Group** in the subscriber label selector.

### Label ID

**Label ID** is a channel-facing mapping field. It can store provider-specific identifiers, such as a label ID from an external messaging platform. Most manually created labels do not need this value.

For day-to-day admin work, rely on:

* **Title** for human-readable selection;
* **Name** for workflow/API stability;
* **Group Label** for mutual exclusion and selector organization.

### How Workflows Use Labels

Workflows can use labels in two main ways:

| Use case                   | How it works                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| Assign or remove labels    | The **Subscriber Update Labels** action accepts label IDs to add or remove from the current subscriber. |
| Branch on subscriber state | Workflow logic can inspect the current subscriber context and choose different paths based on labels.   |

When a workflow assigns a grouped label, backend label logic removes conflicting existing labels from the same group. This keeps the subscriber's group classification consistent whether labels are changed by an operator or a workflow.
