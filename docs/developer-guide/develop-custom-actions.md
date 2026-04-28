---
description: >-
  Create reusable workflow steps with Zod schemas, metadata, and an execute
  function.
icon: bolt
---

# Develop Custom Actions

A custom action is a reusable workflow step.

It defines:

* Metadata shown in the workflow builder
* Zod schemas for runtime input, step settings, and returned output
* An `execute()` function that performs the work

See the [Zod documentation](https://zod.dev/) for the full schema API.

The starter action is `src/extensions/actions/dummy.action.ts`.

Copy it when you create your first real action.

### Where actions live

Put custom actions under:

```
src/extensions/actions/
```

Action files must end with:

```
*.action.ts
```

### Create an action

Start by copying the dummy action:

```sh
cp src/extensions/actions/dummy.action.ts src/extensions/actions/create-ticket.action.ts
```

Then update the schemas, types, metadata, and `execute()` function.

Minimal example:

```ts
import { ConversationalWorkflowContext, createAction } from '@hexabot-ai/api';
import { z } from 'zod';

const createTicketInputSchema = z.object({
  email: z.string().email().meta({
    title: 'Email',
    description: 'Customer email address.',
  }),
  subject: z.string().min(1).meta({
    title: 'Subject',
    description: 'Ticket subject.',
  }),
  message: z.string().min(1).meta({
    title: 'Message',
    description: 'Ticket message.',
  }),
});

const createTicketOutputSchema = z.object({
  ticketId: z.string().meta({
    title: 'Ticket ID',
    description: 'Identifier of the created ticket.',
  }),
  status: z.string().meta({
    title: 'Status',
    description: 'Ticket creation status.',
  }),
});

const createTicketSettingsSchema = z.object({
  priority: z.enum(['low', 'normal', 'high']).default('normal').meta({
    title: 'Priority',
    description: 'Default priority for created tickets.',
  }),
});

type CreateTicketInput = z.infer<typeof createTicketInputSchema>;
type CreateTicketOutput = z.infer<typeof createTicketOutputSchema>;
type CreateTicketSettings = z.infer<typeof createTicketSettingsSchema>;

const CreateTicketAction = createAction<
  CreateTicketInput,
  CreateTicketOutput,
  ConversationalWorkflowContext,
  CreateTicketSettings
>({
  name: 'create_ticket',
  description: 'Creates a support ticket from workflow data.',
  inputSchema: createTicketInputSchema,
  outputSchema: createTicketOutputSchema,
  settingsSchema: createTicketSettingsSchema,
  icon: 'Ticket',
  color: '#2563EB',
  group: 'support',

  async execute({ input, settings }) {
    return {
      ticketId: `ticket_${Date.now()}`,
      status: settings.priority,
    };
  },
});

export default CreateTicketAction;
```

### Action anatomy

| Part             | Purpose                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| `name`           | Unique action identifier. Use `snake_case` with an underscore, such as `create_ticket`. |
| `description`    | Short label shown to workflow authors.                                                  |
| `inputSchema`    | Values mapped into the action at runtime from the workflow.                             |
| `settingsSchema` | Step configuration saved by the workflow author.                                        |
| `outputSchema`   | Shape of the data returned by `execute()` and exposed to later steps.                   |
| `icon`           | Icon name shown in the builder. Use a concise Lucide-style icon name when possible.     |
| `color`          | Hex color used for the action in the UI.                                                |
| `group`          | Logical group in the action list, for example `support`, `web`, or `examples`.          |
| `execute()`      | Function that performs the action and returns data matching `outputSchema`.             |

Hexabot validates input and settings before `execute()` runs.

It also validates the returned value against `outputSchema`.

### Input, settings, and output

Use `inputSchema` for data that changes on every workflow run:

```ts
const inputSchema = z.object({
  orderId: z.string().min(1),
});
```

Use `settingsSchema` for configuration chosen when the workflow is designed:

```ts
const settingsSchema = z.object({
  notifyCustomer: z.boolean().default(true),
});
```

Use `outputSchema` for values later workflow steps can consume:

```ts
const outputSchema = z.object({
  sent: z.boolean(),
  reference: z.string(),
});
```

Keep outputs stable.

Changing output field names can break workflows that already map those fields into later steps.

### Runtime context

The `execute()` function receives:

```ts
async execute({ input, settings, context }) {
  // ...
}
```

Use `context` when an action needs runtime services or event data.

For conversational actions, use `ConversationalWorkflowContext`:

```ts
import { ConversationalWorkflowContext } from '@hexabot-ai/api';
```

Useful services are exposed through `context.services`, including logger, content, message, subscriber, credentials, actions, and MCP services.

Prefer these services over creating isolated clients when Hexabot already provides the integration point.

### Localization

Action labels and schema metadata can be localized.

The starter already includes:

```
src/extensions/actions/i18n/en.translations.json
src/extensions/actions/i18n/fr.translations.json
```

Add translations under the action name:

```json
{
  "create_ticket": {
    "Creates a support ticket from workflow data.": "Creates a support ticket from workflow data.",
    "Email": "Email",
    "Customer email address.": "Customer email address.",
    "Subject": "Subject",
    "Ticket subject.": "Ticket subject."
  }
}
```

Translation files must be named:

```
<lang>.translations.json
```

The Nest build copies `extensions/**/i18n/**/*` into `dist`, so translations stay available with the compiled action.

### Development workflow

1. Add or copy an action in `src/extensions/actions`.
2. Give it a unique `snake_case` name.
3. Define Zod schemas for input, output, and settings.
4. Implement `execute()` and return data that matches `outputSchema`.
5. Add translations if the action has user-facing labels.
6. Run `npm run build` to verify TypeScript and compilation.
7. Restart `npm run dev` or `hexabot dev` so the action is rediscovered.

### Best practices

* Keep each action focused on one workflow capability.
* Validate every input, setting, and output with Zod.
* Use defaults for settings when a workflow author should not configure every field.
* Return plain JSON-compatible data from `execute()`.
* Use clear output field names because later workflow steps depend on them.
* Handle external APIs with timeouts and explicit error messages.
* Keep secrets out of settings. Use Hexabot credentials or environment variables for sensitive values.
* Make network actions idempotent when retries could happen.
* Avoid changing an existing action name after workflows are using it.
