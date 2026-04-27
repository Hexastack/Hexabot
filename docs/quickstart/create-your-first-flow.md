---
description: Create a simple Hexabot workflow, add your first action, and test it locally.
icon: arrow-progress
---

# Create your 1st workflow

Create a simple workflow in a few minutes.

In this guide, you will:

* Create a workflow
* Add your first action
* Test the result

If you still need a local project, start with [Installation](installation.md).

### What a workflow is

A workflow defines how Hexabot starts and what it does next.

You can use workflows for:

* Conversations with users
* Manual tasks started on demand
* Scheduled automations

Each workflow is made of steps. Each step uses an action to send messages, trigger an AI agent to call tools, or update data.

{% hint style="info" %}
You can build a workflow visually, edit it in YAML, or use both. Hexabot keeps them aligned.
{% endhint %}

### Create your first workflow

{% stepper %}
{% step %}
### Open Workflow Builder

Start your local project with `npm run dev` or `hexabot dev`.

Open `http://localhost:3000`.

Sign in with the email and password you created with the Hexabot CLI.

<figure><img src="../.gitbook/assets/image (1) (1) (1) (1) (1) (1) (1) (1).png" alt="" width="375"><figcaption></figcaption></figure>

Open **Workflow Builder**.

<figure><img src="../.gitbook/assets/image (1) (1) (1) (1) (1) (1) (1).png" alt="" width="320"><figcaption></figcaption></figure>

Click **Create Workflow**.

<figure><img src="../.gitbook/assets/image (2) (1) (1) (1) (1) (1).png" alt="" width="375"><figcaption></figcaption></figure>

Name the workflow `Hello World`.
{% endstep %}

{% step %}
### Add a message step

Click the **plus** icon button and select **Step**.

<figure><img src="../.gitbook/assets/image (3) (1).png" alt=""><figcaption></figcaption></figure>

From the action list, select **Send text message**.

<figure><img src="../.gitbook/assets/image (4).png" alt="" width="375"><figcaption></figcaption></figure>

Set the **Text** to:

```
Hello World!
```

<div align="center"><img src="../.gitbook/assets/image (7).png" alt="" width="375"></div>

Click **Save**.

This adds a new step to the workflow.
{% endstep %}

{% step %}
### Save and test

Use the chat widget to test the workflow.

<figure><img src="../.gitbook/assets/image (6).png" alt="" width="300"><figcaption></figcaption></figure>

You should receive:

```
Hello World!
```
{% endstep %}
{% endstepper %}

### How to think about it

Your first workflow only needs two parts:

* **Step** — what the workflow does
* **Action** — the capability used by a step

That same pattern scales to more advanced use cases.

You can add:

* More steps
* Conditions, loops and branching
* AI agents and memory
* Reusable bindings

### Optional: view the YAML

Open the YAML editor to see the workflow definition.

<figure><img src="../.gitbook/assets/image (3).png" alt="" width="375"><figcaption></figcaption></figure>

You do not need to write YAML to get started. It becomes useful as workflows grow.

### What’s next

* Review the platform overview in [Overview](../introduction/overview.md)
* Learn the editor basics in [Using the Workflow Editor](/broken/spaces/12ok30OlFEEb6WoWfH8l/pages/lrcnUbkv9Q09N7z2cmEg)
* Explore workflows across channels, actions, bindings, and memory
