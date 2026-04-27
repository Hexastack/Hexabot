---
description: Build workflows visually and manage them in one place.
icon: diagram-subtask
---

# Workflow Editor

<figure><img src="../.gitbook/assets/image (1) (1) (1) (1) (1).png" alt=""><figcaption></figcaption></figure>

The Workflow Editor is where you build, test, and publish workflows in Hexabot.

It gives you a visual canvas for composing workflow logic. It also includes a YAML view for reviewing or refining the same workflow definition.

You can use it for:

* Conversational workflows
* Manual workflows
* Scheduled workflows

### What you can do

With the Workflow Editor, you can:

* Add steps and shape the workflow path visually
* Configure actions, bindings, and memory
* Test changes before you publish them

This keeps workflow creation accessible for non-technical users, while still giving advanced users precise control when needed.

### Main parts of the editor

The editor is organized around a few simple areas:

* **Workflow list** — create, find, and switch between workflows
* **Canvas** — add steps, branches, loops, and other workflow logic
* **Configuration panel** — edit the selected step and its settings
* **Test panel** — run and validate the workflow before publishing
* **YAML editor** — view or edit the workflow source directly

### Workflow types

Hexabot supports three workflow types:

* **Conversational** — starts from messages and channel events
* **Manual** — runs on demand from the admin UI or API
* **Scheduled** — runs automatically on a defined schedule

The workflow type controls how the workflow starts and how you test it.

### Core concepts

The Workflow Editor uses a few core concepts:

* **Workflow** — the full automation you build and manage
* **Step** — a unit of logic inside the workflow
* **Action** — the operation a step runs
* **Bindings** — reusable connections for tools, models, or other capabilities
* **Memory** — stored context that helps workflows keep useful state

### Visual and YAML views

The visual canvas and YAML editor represent the same workflow.

<figure><img src="../.gitbook/assets/image (1) (1) (1) (1) (1) (1).png" alt=""><figcaption></figcaption></figure>

Use the canvas for fast editing. Use YAML when you want to review the exact definition or make precise updates.

{% hint style="info" %}
You do not need to write YAML to build workflows. The visual editor is enough for most common tasks.
{% endhint %}

### Save, test, and publish

Build the workflow, test it, then publish it when ready.

<figure><img src="../.gitbook/assets/image (2) (1) (1) (1) (1).png" alt=""><figcaption></figcaption></figure>

Draft changes stay separate until you publish them. This lets you iterate safely before a workflow goes live.

### Best practices

* Start with a simple workflow, then expand it
* Reuse bindings when several steps need the same capability
* Test every important path before publishing
