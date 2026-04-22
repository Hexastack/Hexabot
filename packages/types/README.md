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
- `coerce*Stub`, `coerce*`, `coerce*Full`
- `coerce*Nullable`, `coerce*Optional`

Example:

```ts
import {
  coerceSubscriberFull,
  subscriberFullSchema,
  type SubscriberFull,
} from "@hexabot-ai/types";

const payload: SubscriberFull = coerceSubscriberFull(data);
const parsed = subscriberFullSchema.parse(data);
```

## Workflow Parser Bridge

Use parser-aware full workflow coercion to preserve `definitionYml` and `definition` derivation:

```ts
import { coerceWorkflowFullWithParser } from "@hexabot-ai/types";

const workflow = coerceWorkflowFullWithParser(data, (definitionYml) => {
  // API-side parser with binding-aware validation
  return parseWorkflowDefinition(definitionYml);
});
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
- Coercion preserves nullable/optional normalization used by API entity outputs.
- Mixed owner/triggeredBy contracts (`Subscriber | User`) are supported in workflow full contracts.
- Sensitive output parity is preserved for credentials (`value` is not part of output contracts).

## Breaking-Change Notes

- Runtime DTO output classes are replaced by zod schemas + inferred TS types.
- `@Type(() => OutputClass)` patterns should be replaced by zod coercion (`coerce*`) or direct schema parsing.
- Consumers that previously instantiated output DTO classes (`new X()`) must use plain objects typed by exported `type X`.
