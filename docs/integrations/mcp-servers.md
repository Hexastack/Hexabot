---
description: Configure MCP servers and expose their tools to AI actions in workflows.
icon: mcp
---

# MCP Servers

MCP servers connect Hexabot to external Model Context Protocol tools. After a server is configured, its tools can be mounted on built-in AI actions through `mcp` bindings. The model can then call those tools while an AI task runs.

Open MCP servers from **Integrations > MCP Servers** or go to `/workflow/mcp-servers`.

### How MCP Fits Into Workflows

MCP servers are not workflow steps by themselves. They provide tool definitions to AI actions.

Built-in AI actions that support MCP bindings include:

| Action               | Use MCP for                                                                             |
| -------------------- | --------------------------------------------------------------------------------------- |
| `ai_agent`           | Multi-step agent runs that can call MCP tools and continue reasoning from tool results. |
| `ai_generate_text`   | Text generation that may call bound tools before producing text.                        |
| `ai_generate_reply`  | Conversational reply generation with tool access.                                       |
| `ai_generate_object` | Structured output generation with tool access.                                          |
| `ai_infer_object`    | Conversational structured inference with tool access.                                   |

When an AI task has an MCP binding, Hexabot connects to the selected server, loads its tool definitions, optionally filters the tool list, and passes the resulting tools to the AI SDK call.

### MCP Servers Page

The list shows configured MCP servers. Each row includes:

| Column            | Meaning                                                            |
| ----------------- | ------------------------------------------------------------------ |
| ID                | Server identifier used by workflow bindings and API calls.         |
| Name              | Human-readable server name. Names must be unique.                  |
| Enabled           | Whether workflows can use the server at runtime.                   |
| Transport         | `HTTP` or `STDIO`.                                                 |
| Connection        | URL for HTTP servers, or command plus arguments for stdio servers. |
| Credential        | Optional credential used by HTTP servers.                          |
| Created / Updated | Audit dates for the server record.                                 |
| Operations        | Test, tools, edit, and delete actions, depending on permissions.   |

Use the search box to find servers by name, URL, or command.

The Enabled switch is a runtime gate. Disabled servers can still be tested and inspected from the admin page, but workflow runs cannot use them.

### Create an MCP Server

1. Open **Integrations > MCP Servers**.
2. Click **Add**.
3. Enter a unique name.
4. Choose a transport.
5. Fill the transport-specific connection fields.
6. Keep **Enabled** on when workflows should be able to use the server immediately.
7. Click **Save**.

The create and edit forms trim blank values. Fields that do not apply to the chosen transport are cleared before saving.

### Transport Types

#### HTTP

Use HTTP for remote MCP servers reachable from the Hexabot API.

Required field:

| Field | Notes                                                                      |
| ----- | -------------------------------------------------------------------------- |
| URL   | Absolute MCP server URL. Localhost and IP URLs are accepted by validation. |

Optional field:

| Field      | Notes                                                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| Credential | Secret stored in **Integrations > Credentials**. At runtime, Hexabot sends it as an `Authorization: Bearer <value>` header. |

Use HTTP when the MCP server is already deployed as a service or when it needs its own hosting, scaling, or network boundary.

#### Stdio

Use stdio when the API process should start a local MCP server command.

Fields:

| Field   | Required | Notes                                                                  |
| ------- | -------- | ---------------------------------------------------------------------- |
| Command | Yes      | Executable command, such as `npx`, `node`, or an absolute binary path. |
| Args    | No       | Command arguments. Empty arguments are removed before saving.          |
| CWD     | No       | Working directory used when starting the command.                      |

Credentials are not supported for stdio servers. If the command needs secrets or environment variables, configure them in the environment where the Hexabot API process runs. Stdio servers inherit string environment variables from that process.

Use stdio when the MCP server is a local package, script, or binary available on the API host.

### Test a Server

Click the test action to run connectivity diagnostics. The result drawer shows:

| Field          | Meaning                                                  |
| -------------- | -------------------------------------------------------- |
| Status         | Whether Hexabot connected and listed tools successfully. |
| Latency        | Time spent during the diagnostic request.                |
| Checked at     | Timestamp of the test.                                   |
| Tool count     | Number of tools returned by the server.                  |
| Sampled tools  | Up to 10 discovered tool names.                          |
| Server details | Name, transport, connection, and working directory.      |
| Error          | Connection or tool discovery error, when the test fails. |

For stdio servers, diagnostics prefer captured stderr output when startup fails. That usually makes missing packages, missing environment variables, and command errors easier to identify.

Testing can be used before enabling a server because diagnostics allow disabled servers.

### Discover Tools

Click the tools action to list normalized tool metadata from the server. The drawer shows the tool count, server details, and each tool's:

| Field       | Meaning                                                   |
| ----------- | --------------------------------------------------------- |
| Name        | MCP tool name used in allow-lists and runtime tool names. |
| Title       | Optional display title from the MCP server.               |
| Description | Tool description passed to the model.                     |

The API also receives each tool's input schema, optional output schema, annotations, and metadata. The current drawer focuses on names and descriptions because those are the fields most useful when deciding which tools to expose to an AI action.

Run discovery after creating or editing a server, and again whenever the remote server changes its tool set.

### Attach MCP Tools to an AI Action

In the workflow editor:

1. Add or select an AI task, such as `ai_agent` or `ai_generate_text`.
2. Add an MCP binding from the task's bindings controls.
3. Choose an existing MCP binding or create a new one.
4. Select the MCP server.
5. Optionally select specific tool names.
6. Save the binding and run the workflow.

If **Tool names** is empty, Hexabot exposes all tools returned by the selected server. Use an allow-list when the server exposes many tools or when a workflow should only have access to a narrow capability.

The binding name matters. Runtime MCP tool names are prefixed with the binding name:

| Binding name | Server tool     | Runtime tool name    |
| ------------ | --------------- | -------------------- |
| `planner`    | `lookup`        | `planner__lookup`    |
| `crm`        | `create_ticket` | `crm__create_ticket` |

Use the prefixed name when configuring AI action settings such as **Stop tool call**.

YAML shape:

```yaml
defs:
  primary_model:
    kind: model
    settings:
      provider: openai
      model_id: your-model-id
      api_key: 00000000-0000-4000-8000-000000000000

  crm_tools:
    kind: mcp
    settings:
      server_id: 11111111-1111-4111-8111-111111111111
      tool_names:
        - lookup_customer
        - create_ticket

  answer_with_tools:
    kind: task
    action: ai_agent
    inputs:
      input_mode: prompt
      prompt: "=$input.text"
      system: "Use the CRM tools when customer account data is needed."
    bindings:
      model: primary_model
      mcp:
        - crm_tools

flow:
  - do: answer_with_tools
```

### Runtime Behavior

When a workflow run reaches an AI action with MCP bindings:

1. Hexabot reads each mounted MCP binding.
2. It validates that `server_id` is present.
3. It rejects disabled servers for runtime use.
4. It connects to the MCP server using HTTP or stdio.
5. It lists tools from the server.
6. It filters the list when `tool_names` is configured.
7. It prefixes each tool with the binding name.
8. It passes the tools to the AI SDK call.

Hexabot pools MCP clients and reuses them while active. Idle clients are closed after a short period, and configuration changes such as URL, credential, command, args, or CWD cause the next runtime request to reconnect with the new settings.
