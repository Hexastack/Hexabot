# @hexabot-ai/types

Shared zod-first contracts for Hexabot entities.

## What it exports

- Attachment primitives:
  - `AttachmentAccess`
  - `AttachmentCreatedByRef`
  - `AttachmentResourceRef`
- User primitive:
  - `UserProvider`
- Entity schemas:
  - `attachmentStubSchema`, `attachmentSchema`, `attachmentFullSchema`
  - `userStubSchema`, `userSchema`, `userFullSchema`
- Strict nested fragments used by those entities:
  - role, label, subscriber, assigned profile, and owner schemas
- Inferred types:
  - `AttachmentStub`, `Attachment`, `AttachmentFull`
  - `UserStub`, `User`, `UserFull`
- Coercion helpers:
  - `coerceAttachment*`, `coerceUser*`

## Usage

```ts
import {
  coerceUser,
  coerceUserFull,
  userSchema,
  type User,
  type UserFull,
} from '@hexabot-ai/types';

const plain: User = coerceUser(data);
const full: UserFull = coerceUserFull(data);
const parsed = userSchema.parse(data);
```

## Notes

- Schemas are designed for runtime coercion of ORM outputs.
- Alias mapping is supported where ORM relation IDs are exposed as alternate keys:
  - `roleIds -> roles`
  - `avatarId -> avatar`
  - `createdById -> createdBy`
- Unknown keys are stripped by zod object parsing.
