---
description: Connect channels, credentials, and MCP tools that workflows use at runtime.
icon: plug
---

# Integrations

The Integrations section connects Hexabot to external entrypoints and services.

Use it to receive inbound traffic, store shared secrets, and expose external tools to AI actions.

Open it from **Integrations** in the admin panel.

### What you manage here

Integrations is organized into three areas:

* [Channels and Sources](channels-and-sources.md) define how conversations enter Hexabot and which workflow handles them.
* [MCP Servers](mcp-servers.md) connect external Model Context Protocol tools to AI actions.
* [Credentials](credentials.md) store named secrets that integrations and bindings can reference safely.

Each part solves a different integration need, but they are designed to work together.

### How integrations fit into workflows

Most integrations support one of these runtime paths:

1. A channel source receives an inbound event.
2. Hexabot routes that event to a workflow.
3. The workflow uses credentials, MCP tools, or both while it runs.

Common examples:

* A web source receives a user message and starts a conversational workflow.
* An AI task uses an MCP server to call external tools during reasoning.
* A model binding or HTTP service uses a stored credential instead of a pasted secret.

### Choose the right integration type

Use **Channels and Sources** when you need an entrypoint.

Use it for:

* web widgets;
* channel-specific inbound traffic;
* separate sources for environments, brands, or workflows.

Use **Credentials** when you need a reusable secret.

Use it for:

* API keys;
* bearer tokens;
* shared secrets selected by name in forms and bindings.

Use **MCP Servers** when an AI action needs external tools.

Use it for:

* remote MCP services over HTTP;
* local MCP commands over stdio;
* tool discovery and allow-listed tool access in AI workflows.

### Typical setup

For most teams, setup follows a simple order:

1. Create a [Credential](credentials.md) if the integration needs authentication.
2. Configure a [Channel Source](channels-and-sources.md) to receive traffic, or an [MCP Server](mcp-servers.md) to provide tools.
3. Reference that integration from your workflow configuration or binding.
4. Test the flow before relying on it in production.

### Best practices

* Keep source names clear and environment-specific.
* Store secrets in credentials, not in workflow definitions.
* Prefer editing credentials for secret rotation.
* Limit AI tools to the MCP server and tool names a workflow actually needs.
* Disable unused sources or servers instead of deleting them immediately.
