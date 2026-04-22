/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { asId, withAliases } from "../shared/aliases";
import { baseStubSchema } from "../shared/base";
import { preprocess } from "../shared/preprocess";
import { userProfileAssignedSchema } from "../user/user-profile-assigned";

export enum AttachmentCreatedByRef {
  User = "User",
  Subscriber = "Subscriber",
}

export enum AttachmentResourceRef {
  SettingAttachment = "Setting",
  UserAvatar = "User",
  SubscriberAvatar = "Subscriber",
  ContentAttachment = "Content",
  MessageAttachment = "Message",
}

export enum AttachmentAccess {
  Public = "public",
  Private = "private",
}

const attachmentAliasMap = {
  createdById: "createdBy",
} as const;

export const attachmentOwnerSchema = userProfileAssignedSchema;

const attachmentStubObjectSchema = baseStubSchema.extend({
  name: z.string(),
  type: z.string(),
  size: z.coerce.number(),
  location: z.string(),
  channel: preprocess(
    (value) => (value == null ? undefined : value),
    z.record(z.string(), z.unknown()).optional(),
  ).optional(),
  createdByRef: z.nativeEnum(AttachmentCreatedByRef).optional(),
  resourceRef: z.nativeEnum(AttachmentResourceRef),
  access: z.nativeEnum(AttachmentAccess),
  url: preprocess((value) => (value == null ? "" : value), z.string()),
});

export const attachmentStubSchema = attachmentStubObjectSchema;

export const attachmentSchema = preprocess(
  (value) => withAliases(value, attachmentAliasMap),
  attachmentStubObjectSchema.extend({
    createdBy: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string().nullable(),
    ).optional(),
  }),
);

export const attachmentFullSchema = attachmentStubObjectSchema.extend({
  createdBy: preprocess(
    (value) => (value == null ? null : value),
    attachmentOwnerSchema.nullable(),
  ).optional(),
});

export type AttachmentOwner = z.infer<typeof attachmentOwnerSchema>;

export type AttachmentStub = z.infer<typeof attachmentStubSchema>;

export type Attachment = z.infer<typeof attachmentSchema>;

export type AttachmentFull = z.infer<typeof attachmentFullSchema>;
