---
description: >-
  Configure instance-wide settings for chatbot defaults, RAG behavior, contact
  details, and other global options.
hidden: true
icon: gear
---

# Manage Settings

Global settings control application-wide behavior that is shared by the API, admin panel, and runtime services.

Open settings from **Administration > Settings** or go directly to `/settings`.

Settings are different from workflow task settings, channel source settings, and profile settings:

| Setting type           | Where it is edited            | Scope                                              |
| ---------------------- | ----------------------------- | -------------------------------------------------- |
| Global settings        | **Administration > Settings** | Whole Hexabot instance.                            |
| Source settings        | **Integrations > Channels**   | One channel source, such as one web widget source. |
| Workflow task settings | Workflow editor               | One action task or workflow definition.            |
| Profile settings       | User menu                     | The signed-in admin user.                          |

### How Settings Work

The settings page is schema-driven. The API returns setting group schemas from `/api/setting/schemas`, and the frontend renders one tab per group. Field titles, descriptions, validation rules, defaults, widgets, and select options come from the backend schema.

Current values are loaded from `/api/setting`. When you edit a field, the page saves the changed setting automatically after a short debounce. There is no separate Save button.

The backend validates every update against the registered schema for that setting. Invalid values are rejected and are not saved. Some simple string values can be coerced by the API, for example `"true"` to `true` or `"3"` to `3`, when the schema expects that type.

Access to this page requires both `Setting: read` and `Setting: update` permissions.

### Built-In Setting Groups

Fresh installations register these global setting groups from the API setting seed data:

<table><thead><tr><th width="141.99359130859375">Group</th><th width="185.844482421875">Key</th><th>Purpose</th></tr></thead><tbody><tr><td>Chatbot</td><td><code>chatbot_settings</code></td><td>Default chatbot helpers, fallback behavior, and license activation.</td></tr><tr><td>RAG</td><td><code>rag_settings</code></td><td>Retrieval-augmented generation defaults and embedding configuration.</td></tr><tr><td>Contact</td><td><code>contact</code></td><td>Organization contact details and contact form recipient.</td></tr></tbody></table>

Additional groups can appear when installed API extensions register their own runtime settings. Developers add those groups by shipping compiled `*.settings.js` providers from `*.settings.ts` source files. See Global Settings in the developer guide.

### Chatbot Settings

Use the **Chatbot** tab to configure default runtime helpers and fallback behavior.

| Field                      | Effect                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| License key                | License key associated with your Hexabot subscription. The field is rendered as a password input. |
| Default NLU helper         | Helper used by default for natural-language-understanding tasks.                                  |
| Default NLU penalty factor | Numeric penalty factor applied to NLU confidence scoring.                                         |
| Default LLM helper         | Helper used by default for LLM generation tasks.                                                  |
| Default storage helper     | Helper used by default for chatbot storage.                                                       |
| Enable global fallback     | Enables fallback handling when no intent or workflow path matches.                                |
| Fallback messages          | Candidate messages shown when fallback handling runs.                                             |

When a non-empty license key is saved, the admin panel refreshes the signed-in user's license state. If activation succeeds, Hexabot shows the license activation confirmation. If activation fails, the page shows the license service error when one is available.

Changing default helpers affects runtime behavior that relies on the global helper defaults. Workflows or bindings that explicitly select a helper can still override those defaults.

### RAG Settings

Use the **RAG** tab to configure retrieval defaults used by retrieval-augmented generation features.

| Field                     | Effect                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Enable RAG                | Enables or disables RAG features globally.                                         |
| Default RAG mode          | Default retrieval mode. Built-in values are `lexical` and `embedding`.             |
| Embedding provider        | Provider used to create embedding vectors.                                         |
| Embedding model           | Model identifier for the selected embedding provider.                              |
| Embedding API key         | API key used by the embedding provider. The field is rendered as a password input. |
| Embedding base URL        | Optional custom base URL for embedding API requests.                               |
| Embedding dimensions      | Expected vector size for generated embeddings.                                     |
| Top K results             | Maximum number of retrieved chunks returned per query.                             |
| Index only active content | Restricts indexing to active content entries.                                      |

If you use embedding mode, keep the provider, model, dimensions, API key, and base URL aligned. A dimension mismatch between stored vectors and the configured embedding model can break retrieval quality or indexing.

The **Index only active content** option affects what content is included when RAG indexes are built. It does not make inactive content visible in normal content lists.

### Contact Settings

Use the **Contact** tab to maintain public organization details and the recipient for contact submissions.

<table><thead><tr><th width="223.914794921875">Field</th><th>Effect</th></tr></thead><tbody><tr><td>Contact recipient email</td><td>Email address that receives contact form submissions.</td></tr><tr><td>Company name</td><td>Organization name shown to end users.</td></tr><tr><td>Company phone</td><td>Public phone number.</td></tr><tr><td>Company email</td><td>Public contact email address.</td></tr><tr><td>Address line 1 / 2</td><td>Postal address lines.</td></tr><tr><td>City</td><td>City for the postal address.</td></tr><tr><td>Postal code</td><td>Postal or ZIP code.</td></tr><tr><td>State or region</td><td>State, region, or province.</td></tr><tr><td>Country</td><td>Country code or country value for the address.</td></tr></tbody></table>

Keep the recipient email separate from the public company email when support requests should go to an internal queue.

### Security Notes

Settings are global and readable by administrators who can access this page. Grant `Setting` permissions only to users who are allowed to change instance-wide behavior.

Use Credentials for workflow and integration secrets that should be selected by reference. Settings are appropriate for global configuration values that the API itself expects to read as settings.
