/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

export {
  AttachmentAccess,
  AttachmentCreatedByRef,
  AttachmentResourceRef,
  attachmentFullSchema,
  attachmentOwnerStubSchema,
  attachmentSchema,
  attachmentStubSchema,
  coerceAttachment,
  coerceAttachmentFull,
  coerceAttachmentNullable,
  coerceAttachmentOptional,
  coerceAttachmentStub,
} from "./attachment";

export type {
  Attachment,
  AttachmentFull,
  AttachmentOwnerStub,
  AttachmentStub,
} from "./attachment";

export {
  baseStubSchema,
  labelSchema,
  roleSchema,
  subscriberChannelSchema,
  subscriberSchema,
  subscriberStubSchema,
  userProfileAssignedSchema,
  userProfileStubSchema,
  userProviderSchema,
  withAliases,
} from "./fragments";

export type {
  Label,
  Role,
  Subscriber,
  SubscriberStub,
  UserProfileAssigned,
  UserProvider,
} from "./fragments";

export {
  coerceUser,
  coerceUserFull,
  coerceUserNullable,
  coerceUserOptional,
  coerceUserStub,
  userFullSchema,
  userSchema,
  userStubSchema,
} from "./user";

export type { User, UserFull, UserStub } from "./user";
