# @hexabot-ai/types

Shared zod-first runtime contracts for Hexabot API entity outputs.

## Migrated Modules

- `analytics`: `Stats*`
- `chat`: `LabelGroup*`, `Label*`, `Subscriber*`, `Thread*`, `Message*`
- `cms`: `ContentType*`, `Content*`, `Menu*`
- `i18n`: `Language*`, `Translation*`
- `setting`: `Setting*`, `Metadata*`
- `user`: `UserProfile*`, `Model*`, `Permission*`, `Role*`, `Credential*`, `User*`
- `workflow`: `Workflow*`, `WorkflowVersion*`, `WorkflowRun*`, `MemoryDefinition*`, `MemoryRecord*`, `McpServer*`
- `utils/test/dummy`: `Dummy*`
- `attachment`: `Attachment*`

## Standard Export Pattern

Each migrated entity exposes:

- `*StubSchema`, `*Schema`, `*FullSchema`
- `type *Stub`, `type *`, `type *Full`

Example:

```ts
import {
  subscriberFullSchema,
  type SubscriberFull,
} from "@hexabot-ai/types";

const payload: SubscriberFull = subscriberFullSchema.parse(data);
```

## Shared Chat Message Contracts

Chat message payload contracts are now centralized in `@hexabot-ai/types` and exported from package root.

```ts
import {
  ActionOptionsSchema,
  ButtonType,
  FileType,
  OutgoingMessageFormat,
  StdOutgoingMessageSchema,
  attachmentPayloadSchema,
  messageSchema,
  stdIncomingMessageSchema,
  stdOutgoingEnvelopeSchema,
} from "@hexabot-ai/types";
```

Notable chat exports:

- Attachment contracts: `FileType`, `attachmentRefSchema`, `attachmentPayloadSchema`, `AttachmentPayload`, `IAttachmentPayload`, `TAttachmentForeignKey`
- Button contracts: `ButtonType`, `PayloadType`, `buttonSchema`, `Button`, `AnyButton`
- Quick replies: `stdQuickReplySchema`, `payloadSchema`, `StdQuickReply`, `Payload`
- Content/action options: `contentOptionsSchema`, `fallbackOptionsSchema`, `ActionOptionsSchema`
- Message payload + envelope contracts: `StdOutgoingMessageSchema`, `stdIncomingMessageSchema`, `stdOutgoingEnvelopeSchema`, `OutgoingMessageFormat`, `IncomingMessageType`

The shared `messageSchema` is strict and validates `message` as a `StdIncomingMessage | StdOutgoingMessage` union (plain string payloads are rejected).

## Workflow Parser Bridge

Use a parser-aware full workflow schema to preserve `definitionYml` and `definition` derivation:

```ts
import { createWorkflowFullSchema } from "@hexabot-ai/types";

const workflow = createWorkflowFullSchema({
  parseDefinition: (definitionYml) => {
    // API-side parser with binding-aware validation
    return parseWorkflowDefinition(definitionYml);
  },
}).parse(data);
```

You can also build a reusable schema:

```ts
import { createWorkflowFullSchema } from "@hexabot-ai/types";

const schema = createWorkflowFullSchema({ parseDefinition });
const workflow = schema.parse(data);
```

## Alias Compatibility

Common ORM alias mappings from legacy class-transformer DTOs are preserved, including:

- `groupId`, `contentTypeId`, `parentId`
- `subscriberId`, `senderId`, `recipientId`, `sentById`, `threadId`
- `ownerId`, `modelId`, `roleId`, `credentialId`
- `currentVersionId`, `publishedVersionId`, `createdById`
- `workflowId`, `workflowVersionId`, `triggeredById`
- `definitionId`, `runId`

Unknown keys are stripped by default.

## Compatibility Notes

- Legacy API enum/type paths can re-export from this package without value changes.
- Schema parsing preserves nullable/optional normalization used by API entity outputs.
- Mixed owner/triggeredBy contracts (`Subscriber | User`) are supported in workflow full contracts.
- Sensitive output parity is preserved for credentials (`value` is not part of output contracts).

## Breaking-Change Notes

- Runtime DTO output classes are replaced by zod schemas + inferred TS types.
- `@Type(() => OutputClass)` patterns should be replaced by direct zod schema parsing.
- Consumers that previously instantiated output DTO classes (`new X()`) must use plain objects typed by exported `type X`.
