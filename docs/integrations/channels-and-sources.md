---
description: >-
  Configure channel sources that receive inbound traffic and route conversations
  to workflows.
icon: webhook
---

# Channels and Sources

Channels and sources control how external conversations enter Hexabot and how those conversations are routed to workflows.

Open them from **Integrations > Channels** or go to `/settings/sources`.

### Core Concepts

<table><thead><tr><th width="112.242919921875">Concept</th><th>What it means</th></tr></thead><tbody><tr><td>Channel</td><td>An installed communication handler, such as <code>web</code>, <code>console</code>, or a custom channel. A channel defines the transport, message behavior, and settings schema.</td></tr><tr><td>Source</td><td>A configured entrypoint for one channel. A source has its own ID, name, enabled state, default workflow, and channel-specific settings.</td></tr><tr><td>Source ID</td><td>The identifier used by widgets and webhooks to connect to a specific source. For the web widget, this is the <code>sourceId</code> value.</td></tr></tbody></table>

You do not create channel types from this page. The channel list comes from the channels installed in the API. You create and maintain sources for those channels.

Hexabot creates a default source for each registered channel when the API starts and no source exists for that channel. You can add more sources when you need separate entrypoints for different websites, brands, environments, workflows, or settings.

### Source List

The Channels page shows source rows.

<figure><img src="../.gitbook/assets/image (60).png" alt="" width="563"><figcaption></figcaption></figure>

Use the search box to find sources by name or channel. The source name is also shown in the Inbox conversation list, so clear names make support work easier.

Sources are not deleted from the admin panel. Disable a source when you want to stop traffic without losing the source ID, settings, or historical conversation links.

### Create a Source

1. Open **Integrations > Channels**.
2. Click **Add**.
3. Choose a channel from the menu.
4. Enter a unique source name.
5. Select a default workflow, if this entrypoint should start a specific conversational workflow.
6. Keep **Enabled** on if the source should accept traffic immediately.
7. Fill the channel-specific settings.
8. Click **Save**.

The Add button is disabled when the API reports no registered channels. It is hidden when your role does not have source create permission.

### Edit a Source

Click the pencil action on a source row.

Editable fields:

| Field            | Notes                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| Name             | Required and stored without leading or trailing spaces.                               |
| Default workflow | Optional. Leave empty when the client or channel should decide which workflow to run. |
| Enabled          | Turn off to reject new inbound events for this source.                                |
| Settings         | Rendered from the selected channel's settings schema.                                 |

The channel field is read-only in the form. If you need the same settings on another channel, create a new source for that channel.

### Default Workflow Routing

When an inbound event reaches a source, Hexabot resolves the workflow in this order:

<table><thead><tr><th width="111.02487182617188" align="center">Priority</th><th>Source</th></tr></thead><tbody><tr><td align="center">1</td><td>Explicit workflow passed by the client or webhook request.</td></tr><tr><td align="center">2</td><td>Source default workflow.</td></tr><tr><td align="center">3</td><td>Channel or workflow trigger behavior, if no workflow is set.</td></tr></tbody></table>

Use a default workflow when the source should consistently start the same automation. Leave it empty when the source is only used for manual tests, custom dispatch logic, or multiple workflow entrypoints.

The admin chat console uses enabled `console` sources. When a workflow is opened in the visual editor, the embedded console prefers a console source whose default workflow matches that workflow, then a console source with no default workflow, then the first enabled console source.

### Channel Settings

The Settings section is generated from the channel schema returned by the API. Different channels can expose different fields. The backend validates these settings again when you save, so invalid values can still be rejected by the API.

Built-in web-style sources commonly include:

<table><thead><tr><th width="236.0496826171875">Setting</th><th>Effect</th></tr></thead><tbody><tr><td>Allowed domains</td><td>Comma-separated CORS origins allowed to connect to the source. The API checks this before accepting web-style requests. Use exact origins such as <code>https://www.example.com</code>, or <code>*</code> only when any origin should be allowed.</td></tr><tr><td>Greeting message</td><td>Message shown on the widget pre-chat screen.</td></tr><tr><td>Window title</td><td>Header title for the web widget. Available on the <code>web</code> channel.</td></tr><tr><td>Avatar URL</td><td>Chatbot avatar image URL. Available on the <code>web</code> channel.</td></tr><tr><td>Show emoji / file / location</td><td>Enables or hides those widget actions.</td></tr><tr><td>Allowed upload types</td><td>Comma-separated MIME types accepted by the widget upload input.</td></tr><tr><td>Thread inactivity hours</td><td>Starts a new thread when the last message is older than this threshold.</td></tr><tr><td>Show start button / Disable input / Persistent menu</td><td>Exposed by the built-in schema for compatible web-style clients. Current widget behavior also depends on the widget implementation and available menu items.</td></tr></tbody></table>

If the form says no settings schema is available, the channel did not expose configurable source settings. You can still save the source with empty settings.

### Web Widget Sources

For a web widget deployment, create or choose an enabled `web` source and use its ID in the widget configuration:

```tsx
<ChatWidget
  apiUrl="https://api.example.com/api"
  channel="web"
  sourceId="<source-id>"
  language="en"
/>
```

At runtime, the widget connects with that source ID. Hexabot then sends the source settings, persistent menu tree, current profile, thread information, and message history back to the widget.

The widget will not connect without a source ID. A disabled source, wrong source ID, wrong channel, or missing allowed domain can prevent the widget from loading or sending messages.

### Inbox Behavior

Sources are attached to subscribers and threads. In the Inbox:

<table><thead><tr><th width="194.88494873046875">UI behavior</th><th>Detail</th></tr></thead><tbody><tr><td>Source filter</td><td>Filters conversations by enabled sources.</td></tr><tr><td>Conversation badge</td><td>Shows the source name beside each conversation.</td></tr><tr><td>Thread history</td><td>Keeps the source association even if the source is later disabled.</td></tr></tbody></table>

Use separate sources when support agents need to distinguish traffic from different websites, products, regions, or test environments.
