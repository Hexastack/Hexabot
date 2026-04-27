---
description: >-
  Find subscribers, segment audiences, and manage labels for routing and
  workflow state.
icon: users
---

# Audience

The Audience section helps you organize subscribers for targeting, routing, and follow-up. Use it to manage labels and the group structure behind those labels.

### What the Audience section is for

Use Audience when subscriber state should stay attached to the profile and remain available across workflows.

Common use cases include:

* segmenting subscribers by lifecycle, interest, or eligibility;
* routing conversations based on support status or tier;
* tracking durable workflow state on the subscriber profile.

Audience data is more durable than one-off workflow variables. It is meant for subscriber classification that operators and later workflows can reuse.

### How it fits together

The Audience section has two main parts:

* [Labels](labels.md) are the tags assigned to subscribers.
* [Label Groups](label-groups.md) organize labels into mutually exclusive categories.

In practice, labels store the value and groups define the category.

For example:

* group: `Lifecycle`
* labels in that group: `Lead`, `Qualified`, `Customer`

A subscriber can keep one active label from that group at a time.

### Labels vs. label groups

Use a label when you need to mark a subscriber with a meaningful state or attribute.

Use a label group when several labels represent alternative values for the same concept.

Typical examples:

| Need                                                   | Use                                   |
| ------------------------------------------------------ | ------------------------------------- |
| Mark interest in billing and delivery at the same time | Separate labels with no shared group. |
| Mark one lifecycle stage at a time                     | Labels in a shared `Lifecycle` group. |
| Mark one priority level at a time                      | Labels in a shared `Priority` group.  |

If two labels should be able to coexist on one subscriber, do not put them in the same group.

### Typical workflow

1. Define the subscriber categories you need, such as lifecycle, priority, or interest.
2. Create label groups for categories that should be exclusive.
3. Create labels and assign them to groups where needed.
4. Apply labels from operators or workflow actions.
5. Use those labels in filters, routing, and follow-up workflows.

### How workflows use audience data

Workflows can use audience labels to:

* assign or remove subscriber labels;
* branch logic based on current subscriber state;
* keep routing and segmentation consistent across runs.

When a workflow assigns a grouped label, conflicting labels from the same group are removed automatically. This keeps one-of-many classifications, such as lifecycle or priority, consistent.

### Best practices

* Use labels for durable subscriber state, not temporary step data.
* Group only labels that should be mutually exclusive.
* Keep label titles clear for operators.
* Keep technical names stable once workflows depend on them.
* Review grouped labels carefully before deleting or restructuring them.
