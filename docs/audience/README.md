---
description: Find subscribers, filter audience segments, and manage subscriber labels.
icon: users
---

# Audience

Subscribers represent people or external users who interact with Hexabot through channels. A subscriber is created when a channel, source, or session resolves an end-user profile, then Hexabot keeps that profile available for conversations, workflow runs, labels, and handover.

Open subscribers from **Audience > Subscribers** or by going to `/subscribers`.

### What Subscribers Are For

Use the subscribers page to:

* find the people who have interacted with the bot;
* confirm profile details such as first name, last name, locale, gender, and channel;
* review the audience labels currently attached to each subscriber;
* assign or remove labels manually;
* filter a segment before investigating inbox conversations or workflow runs.

The current frontend does not create subscribers from this page. Subscriber records normally come from channel activity, web chat sessions, imports, or backend integrations.

### Subscribers List

The table shows one row per subscriber.

| Column     | Meaning                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| Avatar     | Subscriber avatar when one exists, otherwise a generated fallback avatar. |
| First name | First name stored on the subscriber profile.                              |
| Last name  | Last name stored on the subscriber profile.                               |
| Locale     | Locale reported by the channel or profile.                                |
| Labels     | Label chips currently assigned to the subscriber.                         |
| Gender     | Gender value reported by the channel or profile.                          |
| Channel    | Channel name stored in the subscriber profile, such as `web`.             |
| Created At | Date and time the subscriber record was created.                          |
| Updated At | Date and time the subscriber record was last changed.                     |
| Operations | Label management action, when you have update permission.                 |

The internal subscriber ID exists in the table data but is hidden by default.

### Searching

Use the search box to find subscribers by first name or last name. Search state is synchronized with the URL, so you can refresh the page or share a filtered view without losing the query.

Examples:

* search a first name when an operator reports a conversation;
* search a family name before applying a label;
* combine search with the label filter to narrow a large audience segment.

Search does not currently target channel, locale, gender, or label text. Use the structured label filter for label-based lookup.

### Filtering By Label

Use the **Labels** filter in the page header to show subscribers who have a specific label. The filter writes the selected label ID to the URL query, and the table only returns subscribers whose labels include that ID.

This is useful when you need to:

* review everyone in a campaign or handover segment;
* confirm that a workflow assigned a label correctly;
* audit subscribers before deleting or renaming labels;
* open related inbox conversations after narrowing the audience.

Clear the label filter to return to the full subscriber list.

### Manage Subscriber Labels

Use the tag action in the **Operations** column to open **Manage Subscribers** for one subscriber. The dialog shows the subscriber name in a read-only **User** field and a multi-select **Labels** field.

To update labels:

1. Open **Audience > Subscribers**.
2. Search or filter until you find the subscriber.
3. Click the label management action in **Operations**.
4. Add or remove labels in the **Labels** selector.
5. Click **Submit**.

When the save succeeds, the subscriber list is refreshed so counts and label chips stay current.

### Label Selector Behavior

The label selector groups labels by label group. Labels without a group appear under **Default Group**.

Grouped labels are mutually exclusive in the selector. After you select one label from a group, other labels from the same group are disabled unless they are already selected. Use this pattern for one-of-many classifications such as lifecycle stage, priority, eligibility, or language preference.

Ungrouped labels appear together under **Default Group** for display, but they do not represent a named exclusive category. If a subscriber should be able to hold several related tags at the same time, leave those labels ungrouped or place them in separate groups.

If you have label create permission, the label selector also shows an **Add** button. Use it to create a missing label without leaving the subscriber dialog, then return to the selector and assign it.

### How Labels Affect Workflows

Subscriber labels are part of the audience profile used by workflow and channel logic. They can be used to:

* segment subscribers before running outreach or support workflows;
* store the result of a previous workflow decision;
* trigger different branches in conversational workflows;
* track subscribers who need human follow-up;
* expose readable label names in workflow runtime state.

The **Subscriber Update Labels** workflow action can assign and remove labels from the current subscriber during a run. Manual edits on this page and workflow-driven updates write to the same subscriber label list.
