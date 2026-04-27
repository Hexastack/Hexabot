---
description: >-
  Store named secrets for integrations and workflow bindings without exposing
  raw values.
icon: key
---

# Credentials

Credentials store named secret values that integrations and workflow bindings can reference without putting raw secrets into workflow definitions or connector records.

Open credentials from **Integrations > Credentials** or go to `/credentials`.

### What Credentials Are For

Use credentials for values such as:

<table><thead><tr><th width="281.752197265625">Secret type</th><th>Common use</th></tr></thead><tbody><tr><td>API keys</td><td>AI provider model bindings, external services, and provider-specific auth.</td></tr><tr><td>Bearer tokens</td><td>HTTP MCP servers that require an <code>Authorization</code> header.</td></tr><tr><td>Long-lived integration secrets</td><td>Values that should be selected by name rather than pasted into workflow YAML.</td></tr></tbody></table>

Credentials are best for application-level integration secrets managed from the admin panel. They do not replace environment variables used to boot the API, such as SMTP settings, database URLs, or process-level secrets.

### Credentials Page

The Credentials page shows stored credential records. Each row includes:

| Column            | Meaning                                                 |
| ----------------- | ------------------------------------------------------- |
| ID                | Credential identifier used by bindings and API records. |
| Name              | Human-readable unique name.                             |
| Owner             | User who created the credential.                        |
| Value             | Always masked in the list.                              |
| Created / Updated | Audit dates for the credential record.                  |
| Operations        | Edit and delete actions, depending on permissions.      |

Use the search box to find credentials by name.

Credential values are not returned by normal API responses. Even when a credential is loaded for editing, the secret value is not prefilled.

### Create a Credential

1. Open **Integrations > Credentials**.
2. Click **Add**.
3. Enter a unique name.
4. Paste the secret value.
5. Click **Save**.

The owner is set automatically to the authenticated user creating the credential.

Credential names should describe the secret's purpose rather than reveal the secret itself. For example, use `OPENAI_PROD_API_KEY`, `MCP_CRM_TOKEN`, or `SUPPORT_PROVIDER_KEY`.

Credentials are tied to their owner account. If that user is deleted, credentials owned by that user can be deleted with the account.

### Edit a Credential

Click the pencil action on a credential row.

Editable fields:

| Field | Notes                                                                                               |
| ----- | --------------------------------------------------------------------------------------------------- |
| Name  | Required. Must remain unique.                                                                       |
| Value | Required. The existing value is not shown, so paste the current or replacement value before saving. |

Editing is useful for rotating a token while keeping the same credential ID. This preserves references from model bindings, MCP servers, and workflow definitions.

If you only need to rename a credential, you still need to enter the secret value because the frontend cannot read the existing value back from the API.

### Delete a Credential

Click the trash action and confirm deletion.

Delete credentials carefully:

| Reference type             | Effect of deleting the credential                                                       |
| -------------------------- | --------------------------------------------------------------------------------------- |
| HTTP MCP server credential | The server loses its credential reference or fails when it tries to build auth headers. |
| AI model binding API key   | The workflow can keep a stale credential ID and fail when the AI action runs.           |
| Other custom integrations  | Behavior depends on the integration.                                                    |

Prefer editing a credential to rotate its value. Delete only when no active workflow, MCP server, or integration depends on it.

### Where Credentials Are Used

#### AI Model Bindings

Built-in AI actions use model bindings to choose a provider, model, and optional API key credential. The model binding form's **Credential** field selects records from this page.

At runtime, AI actions resolve the credential value and pass it to the provider initialization. This is used by actions such as:

| Action               |
| -------------------- |
| `ai_agent`           |
| `ai_generate_text`   |
| `ai_generate_reply`  |
| `ai_generate_object` |
| `ai_infer_object`    |

YAML shape:

```yaml
defs:
  primary_model:
    kind: model
    settings:
      provider: openai
      model_id: your-model-id
      api_key: 00000000-0000-4000-8000-000000000000

  generate_answer:
    kind: task
    action: ai_generate_text
    inputs:
      prompt: "=$input.text"
    bindings:
      model: primary_model
```

In this example, `api_key` is the credential ID, not the raw API key.

#### MCP Servers

HTTP MCP servers can reference a credential. At runtime, Hexabot resolves the value and sends it as:

```http
Authorization: Bearer <credential-value>
```

Stdio MCP servers do not support credential records. Use environment variables for stdio server secrets, because the stdio command runs as a child process of the API.

#### Inline Creation From Other Forms

Some generated forms, such as AI model binding and HTTP MCP server forms, let users create a credential without leaving the current workflow. The created record is the same kind of credential shown on this page.

### Security Model

Credentials reduce accidental exposure, but they are not a complete secrets-management system.

Important behavior:

<table><thead><tr><th width="315.803955078125">Behavior</th><th>Detail</th></tr></thead><tbody><tr><td>Values are write-only in normal UI flows</td><td>The API output schemas omit the <code>value</code> field.</td></tr><tr><td>Lists mask values</td><td>The frontend always shows the value column as asterisks.</td></tr><tr><td>Runtime services can resolve values</td><td>Server-side services call the credential service when an action or integration needs the secret.</td></tr><tr><td>Names are visible</td><td>Do not put secret material in credential names.</td></tr><tr><td>Deleting can break references</td><td>Stored workflow definitions may still point to a deleted credential ID.</td></tr></tbody></table>

Store only secrets that Hexabot needs at runtime. Do not use credentials as a general password vault for values unrelated to workflows or integrations.
