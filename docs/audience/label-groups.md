---
description: >-
  Organize labels into exclusive groups for subscriber segmentation and workflow
  logic.
icon: tag
---

# Label Groups

Label groups organize labels in selector controls and define one-of-many label categories for subscriber profiles. They are managed inline from the label form rather than through a separate page in the current frontend.

Use label groups when several labels represent alternative values for the same concept, such as lifecycle stage or priority.

### Where Groups Appear

Label groups appear in:

| Area                        | Behavior                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| **Audience > Labels**       | The **Group Label** column shows each label's group.                                     |
| New/Edit Label dialog       | The **Group Label** selector lets you choose, create, or delete groups.                  |
| Subscriber label management | Labels are grouped in the selector, with ungrouped labels shown under **Default Group**. |
| Workflow label actions      | Group semantics are respected when labels are assigned to subscribers.                   |

There is no dedicated **Label Groups** sidebar item at the moment.

### Group Semantics

Groups make labels mutually exclusive during subscriber assignment. If a subscriber already has one label from a group and you assign another label from the same group, the existing grouped label is removed and the new one becomes the active value for that group.

This behavior is useful for state-like classifications:

| Group           | Labels                               |
| --------------- | ------------------------------------ |
| Lifecycle       | Lead, qualified, customer, inactive. |
| Priority        | Low, normal, high, urgent.           |
| Case status     | Open, waiting, resolved.             |
| Language bucket | English, French, Arabic.             |
| Routing tier    | Sales, support, billing.             |

Use separate groups when labels should coexist. For example, a subscriber may need one lifecycle label and one priority label at the same time, so those labels should not share the same group.

### Create a Group

Groups are created from the **Group Label** selector while creating or editing a label.

1. Open **Audience > Labels**.
2. Click **Add** or edit an existing label.
3. Open the **Group Label** selector.
4. Type the new group name.
5. Select **Add ""**.
6. Finish the label form and click **Submit**.

The new group is automatically selected for the current label after it is created.

### Assign a Label to a Group

1. Open **Audience > Labels**.
2. Edit the label.
3. Choose a value in **Group Label**.
4. Click **Submit**.

The labels table updates the **Group Label** column after the change. Subscriber label selectors then display the label under that group.

### Remove a Label From a Group

Edit the label, clear the **Group Label** field, and submit the form. The label remains available, but it appears under **Default Group** in subscriber selectors.

Use this when a label should be able to coexist with labels that previously shared the same group.

### Delete a Group

Open the **Group Label** selector in the label form and use the delete action beside the group name. The frontend asks for confirmation before deletion.

Deleting a group does not delete the labels that belonged to it. The backend clears the group reference on those labels, so they become ungrouped and appear under **Default Group**.

Before deleting a group, review:

* whether the group is still needed for subscriber label exclusivity;
* which labels will become ungrouped;
* workflows or operator procedures that depend on the group structure.

### Design Guidelines

Use groups for exclusive classifications. Good group names describe the category, not the individual value: **Lifecycle**, **Priority**, **Case Status**, **Region**, **Routing Tier**.

Avoid putting unrelated labels in the same group. If two labels should both be assignable to one subscriber, they need different groups or no group conflict.

Keep group names short and stable. Operators see them as section headers in selectors, and changing group structure can alter how subscriber labels are applied.
