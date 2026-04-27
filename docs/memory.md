---
icon: database
---

# Memory

Memory definitions describe structured data that workflows can remember for the current subscriber, user, or workflow initiator. A definition is the contract: it gives the memory a name, a stable slug, a scope, an optional TTL, and a JSON schema. The actual saved values are memory records created later when a workflow or AI action writes to that definition.

<figure><img src=".gitbook/assets/image (53).png" alt=""><figcaption></figcaption></figure>

Use memory definitions for durable facts and preferences that should survive beyond one workflow step, such as a subscriber's preferred name, language, product interest, support context, or workflow-specific state.

### Where to Find Them

Open **Workflows > Memory** to manage memory definitions.

The list shows each definition's name, slug, scope, TTL, creation date, and last update date. From this page you can create, edit, search, and delete definitions if your role has the required memory definition permissions.

<figure><img src=".gitbook/assets/image (54).png" alt="" width="563"><figcaption></figcaption></figure>

### Definition Fields

<table><thead><tr><th width="147.249267578125">Field</th><th>Purpose</th></tr></thead><tbody><tr><td>Name</td><td>Human-readable label shown in the admin panel and used as the heading when AI actions receive memory context. Names must be unique.</td></tr><tr><td>Slug</td><td>Stable technical key used in workflow YAML, <code>$context.memory</code>, and <code>update_memory</code> inputs. Use lowercase letters, numbers, and underscores only, such as <code>customer_profile</code>. Slugs must be unique.</td></tr><tr><td>Scope</td><td>Controls how records are separated for the current owner, workflow, thread, or run.</td></tr><tr><td>TTL (seconds)</td><td>Optional lifetime for records created from this definition. Leave blank for permanent memory. Use a positive integer to expire records after that many seconds.</td></tr><tr><td>Schema</td><td>JSON object schema that validates every value saved for this memory.</td></tr></tbody></table>

The schema builder creates object schemas with named properties. For each property, choose a type, add a description, and mark it required only when every update can reliably provide that field. Object schemas are strict: unexpected properties are rejected when memory is written.

### Scopes

All scopes are still tied to the current memory owner, usually the subscriber or user profile that triggered the workflow. **Global** does not mean one shared value for all subscribers.

<table><thead><tr><th width="107.68609619140625">Scope</th><th>Record identity</th><th>Use it for</th></tr></thead><tbody><tr><td>Global</td><td>Owner + memory definition</td><td>Long-lived facts that should follow the same subscriber across workflows, such as language, preferred name, or stable preferences.</td></tr><tr><td>Workflow</td><td>Owner + workflow + memory definition</td><td>State that should be shared across runs of one workflow but not reused by other workflows.</td></tr><tr><td>Thread</td><td>Owner + conversation thread + memory definition</td><td>Conversation-specific context that should remain available across workflow runs in the same thread.</td></tr><tr><td>Run</td><td>Owner + workflow run + memory definition</td><td>Temporary scratch data that should disappear after the current run.</td></tr></tbody></table>

TTL is applied when a record is created or updated. Updating a record refreshes its expiry. Expired records are no longer loaded into workflow memory and can be cleaned up by backend maintenance.

### Create a Definition

1. Open **Workflows > Memory**.
2. Select **Add**.
3. Enter a clear name, such as `Customer Profile`.
4. Check the generated slug. Keep it stable because workflows and expressions reference it.
5. Choose the scope.
6. Leave TTL blank for permanent memory, or enter a positive number of seconds.
7. Add schema properties, descriptions, and required flags.
8. Save the definition.

Example schema for a global profile memory:

```json
{
  "type": "object",
  "title": "Customer Profile",
  "additionalProperties": false,
  "properties": {
    "preferred_name": {
      "type": "string",
      "description": "Name the subscriber wants the assistant to use."
    },
    "language": {
      "type": "string",
      "description": "Preferred response language."
    },
    "interests": {
      "type": "array",
      "description": "Stable topics or products the subscriber cares about.",
      "items": {
        "type": "string"
      }
    }
  }
}
```

For AI-updated memory, prefer optional fields unless the assistant can always provide the full required object. A memory update replaces the stored value for that slug, so required fields must be included in the update.

### Use Memory in a Workflow

A workflow uses memory through a memory binding. The binding is workflow-local and points to one memory definition by ID.

<figure><img src=".gitbook/assets/image (55).png" alt=""><figcaption></figcaption></figure>

In the editor:

1. Open a workflow in the workflow builder.
2. Select an action node that supports memory, such as an AI action.
3. Add a **memory** binding from the node's binding controls.
4. Choose an existing workflow memory binding, or create a new one.
5. In the binding form, select the memory definition from the **Memory definition** field.
6. Save the workflow version and test the workflow.

The YAML shape looks like this:

```yaml
defs:
  customer_profile_memory:
    kind: memory
    description: Profile facts remembered for this subscriber.
    settings:
      definition_id: 00000000-0000-4000-8000-000000000000

  primary_model:
    kind: model
    settings:
      provider: openai
      model_id: gpt-5.2

  answer_customer:
    kind: task
    action: ai_generate_reply
    inputs:
      input_mode: history
      messages_limit: 6
      system: "You are a concise support assistant. Use memory when it is relevant."
    bindings:
      model: primary_model
      memory:
        - customer_profile_memory

flow:
  - do: answer_customer
```

The binding name, such as `customer_profile_memory`, only identifies the binding inside this workflow. The memory slug, such as `customer_profile`, comes from the selected memory definition and is the key used at runtime.

### Read Memory in Expressions

Loaded memory values are available under `$context.memory`, keyed by memory slug.

```yaml
defs:
  greet_by_name:
    kind: task
    action: send_text_message
    inputs:
      text: "='Hello ' & ($context.memory.customer_profile.preferred_name ? $context.memory.customer_profile.preferred_name : 'there')"

flow:
  - do: greet_by_name
```

If no active record exists for a slug, that key may be missing. Use `$exists(...)` or a conditional fallback when reading memory in expressions.

### Use Memory with AI Actions

The built-in AI generation actions support memory bindings through the API action base class. This includes `ai_agent`, `ai_generate_reply`, `ai_generate_text`, `ai_generate_object`, and `ai_infer_object`. The exact actions shown in the editor depend on the workflow type.

When an AI task has memory bindings:

1. Hexabot resolves each selected memory definition by ID.
2. Active records for the current owner and matching scope are loaded.
3. Existing values are appended to the model system instructions under `# Working Memory`.
4. Values are grouped by memory definition name.
5. Undefined fields are omitted.
6. Hexabot exposes an `update_memory` tool to the model for the selected memory slugs.

The memory prompt sent to the model is shaped like this:

```
# Working Memory
## Customer Profile
- Preferred name: Ada
- Language: en
- Interests: ["billing","enterprise plan"]
```

Memory is not automatically written just because it is visible to the model. If you want the assistant to remember stable facts, include an instruction such as:

```
When the user gives a stable preference or correction, call update_memory to save it. Do not store secrets, payment details, or one-time message content.
```

The `update_memory` tool exposed to the model is constrained to the memory bindings mounted on that task. Its input follows this shape:

```json
{
  "memory": {
    "customer_profile": {
      "preferred_name": "Ada",
      "language": "en",
      "interests": ["billing"]
    }
  }
}
```

Each value must match the memory definition schema. The top-level `memory` object is partial, so the model can update one selected slug without updating every selected slug. The value for a slug is written as the new value for that memory record, so include any existing fields that should be preserved.

### Use the Memory Action Directly

You can also add the `update_memory` action as a normal workflow task. This is useful when the workflow already extracted structured values and should write them deterministically instead of asking the model to decide.

Global memory definitions are loaded automatically. For workflow, thread, or run scoped definitions, declare a `kind: memory` definition in `defs` so the runtime knows which memory definition to load. The `update_memory` task itself does not need a `bindings` block.

```yaml
defs:
  customer_profile_memory:
    kind: memory
    settings:
      definition_id: 00000000-0000-4000-8000-000000000000

  save_customer_profile:
    kind: task
    action: update_memory
    inputs:
      memory:
        customer_profile:
          preferred_name: "=$input.name"
          language: "=$input.language"

flow:
  - do: save_customer_profile
```

The action validates slug names first, then the memory store validates that the slug is known and that the value matches the loaded definition schema.

### Design Guidelines

Keep memory small and stable. Store facts that improve later interactions, not full conversation transcripts. Use the inbox and run debugger for conversation history and diagnostics.

Use field descriptions. AI actions use schema-derived field labels and descriptions to understand what belongs in each property.

Avoid storing secrets. Use credentials for API keys and tokens. Do not store passwords, payment data, authentication codes, or sensitive personal information unless your deployment has the required consent and retention controls.

Choose the narrowest scope that matches the need. Use `global` for durable subscriber preferences, `thread` for conversation context, `workflow` for workflow-specific state, and `run` for short-lived intermediate data.

Be careful when changing schemas after records exist. Tightening types or adding required fields can cause existing records to fail validation when workflows load or update memory.

Avoid naming a custom AI tool `update_memory`. AI actions reserve that tool name when memory bindings are mounted.
