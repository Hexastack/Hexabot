/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { attachmentSchema } from "./attachment";
import {
  asId,
  baseStubSchema,
  preprocess,
  subscriberSchema as subscriberPlainBaseSchema,
  subscriberStubSchema as subscriberBaseStubSchema,
  userProfileAssignedSchema,
  withAliases,
} from "./fragments";
import { userSchema } from "./user";

const nullableOptionalDateSchema = preprocess(
  (value) => (value == null ? undefined : value),
  z.coerce.date().nullable().optional(),
);
const nullableOptionalStringSchema = preprocess(
  (value) => (value == null ? undefined : value),
  z.string().nullable().optional(),
);
const labelGroupObjectSchema = baseStubSchema.extend({
  name: z.string(),
});
const labelAliasMap = {
  groupId: "group",
} as const;
const labelStubObjectSchema = baseStubSchema.extend({
  title: z.string(),
  name: z.string(),
  label_id: preprocess(
    (value) => (value == null ? undefined : value),
    z.record(z.string(), z.unknown()).nullable().optional(),
  ).optional(),
  description: nullableOptionalStringSchema,
  builtin: z.coerce.boolean(),
});
const subscriberAliasMap = {
  labelIds: "labels",
  assignedToId: "assignedTo",
  avatarId: "avatar",
} as const;
const threadAliasMap = {
  subscriberId: "subscriber",
} as const;
const threadStubObjectSchema = baseStubSchema.extend({
  status: z.enum(["open", "closed"]),
  lastMessageAt: nullableOptionalDateSchema,
  closedAt: nullableOptionalDateSchema,
  closeReason: preprocess(
    (value) => (value == null ? undefined : value),
    z.enum(["manual", "inactivity"]).nullable().optional(),
  ).optional(),
  title: nullableOptionalStringSchema,
});
const messageAliasMap = {
  senderId: "sender",
  recipientId: "recipient",
  sentById: "sentBy",
  threadId: "thread",
} as const;
const messagePayloadSchema = preprocess(
  (value) => (value == null ? {} : value),
  z.any(),
);
const messageStubObjectSchema = baseStubSchema.extend({
  mid: preprocess(
    (value) => (value == null ? undefined : value),
    z.string().optional(),
  ),
  message: messagePayloadSchema,
  read: z.coerce.boolean(),
  delivery: z.coerce.boolean(),
  handover: z.coerce.boolean(),
});

export const labelGroupStubSchema = labelGroupObjectSchema;

export const labelGroupSchema = labelGroupObjectSchema.extend({
  labels: preprocess(() => undefined, z.undefined().optional()).optional(),
});

export const labelStubSchema = labelStubObjectSchema;

export const labelSchema = preprocess(
  (value) => withAliases(value, labelAliasMap),
  labelStubObjectSchema.extend({
    group: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string().nullable(),
    ).optional(),
    users: preprocess(() => undefined, z.undefined().optional()).optional(),
  }),
);

export const subscriberStubSchema = subscriberBaseStubSchema;

export const subscriberSchema = preprocess(
  (value) => withAliases(value, subscriberAliasMap),
  subscriberPlainBaseSchema,
);

export const threadStubSchema = threadStubObjectSchema;

export const threadSchema = preprocess(
  (value) => withAliases(value, threadAliasMap),
  threadStubObjectSchema.extend({
    subscriber: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string(),
    ),
  }),
);

export const messageStubSchema = messageStubObjectSchema;

export const messageSchema = preprocess(
  (value) => withAliases(value, messageAliasMap),
  messageStubObjectSchema.extend({
    sender: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string().nullable(),
    ).optional(),
    recipient: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string().nullable(),
    ).optional(),
    sentBy: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string().nullable(),
    ).optional(),
    thread: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string(),
    ),
  }),
);

export const labelGroupFullSchema = labelGroupObjectSchema.extend({
  labels: preprocess(
    (value) => (Array.isArray(value) ? value : []),
    z.array(labelSchema),
  ).optional(),
});

export const labelFullSchema = preprocess(
  (value) => withAliases(value, labelAliasMap),
  labelStubObjectSchema.extend({
    users: preprocess(
      (value) => (Array.isArray(value) ? value : []),
      z.array(subscriberSchema),
    ).optional(),
    group: preprocess(
      (value) => (value == null ? null : value),
      labelGroupSchema.nullable(),
    ).optional(),
  }),
);

export const subscriberFullSchema = preprocess(
  (value) => withAliases(value, subscriberAliasMap),
  subscriberBaseStubSchema.extend({
    labels: preprocess(
      (value) => (Array.isArray(value) ? value : []),
      z.array(labelSchema),
    ),
    assignedTo: preprocess(
      (value) => (value == null ? null : value),
      userProfileAssignedSchema.nullable(),
    ),
    avatar: preprocess(
      (value) => (value == null ? null : value),
      attachmentSchema.nullable(),
    ),
  }),
);

export const threadFullSchema = preprocess(
  (value) => withAliases(value, threadAliasMap),
  threadStubObjectSchema.extend({
    subscriber: preprocess((value) => value, subscriberSchema),
  }),
);

export const messageFullSchema = preprocess(
  (value) => withAliases(value, messageAliasMap),
  messageStubObjectSchema.extend({
    sender: preprocess(
      (value) => (value == null ? null : value),
      subscriberSchema.nullable(),
    ).optional(),
    recipient: preprocess(
      (value) => (value == null ? null : value),
      subscriberSchema.nullable(),
    ).optional(),
    sentBy: preprocess(
      (value) => (value == null ? null : value),
      userSchema.nullable(),
    ).optional(),
    thread: preprocess((value) => value, threadSchema),
  }),
);

export type LabelGroupStub = z.infer<typeof labelGroupStubSchema>;

export type LabelGroup = z.infer<typeof labelGroupSchema>;

export type LabelGroupFull = z.infer<typeof labelGroupFullSchema>;

export type LabelStub = z.infer<typeof labelStubSchema>;

export type Label = z.infer<typeof labelSchema>;

export type LabelFull = z.infer<typeof labelFullSchema>;

export type SubscriberStub = z.infer<typeof subscriberStubSchema>;

export type Subscriber = z.infer<typeof subscriberSchema>;

export type SubscriberFull = z.infer<typeof subscriberFullSchema>;

export type ThreadStub = z.infer<typeof threadStubSchema>;

export type Thread = z.infer<typeof threadSchema>;

export type ThreadFull = z.infer<typeof threadFullSchema>;

export type MessageStub = z.infer<typeof messageStubSchema>;

export type Message = z.infer<typeof messageSchema>;

export type MessageFull = z.infer<typeof messageFullSchema>;

export const coerceLabelGroupStub = (value: unknown): LabelGroupStub => {
  return labelGroupStubSchema.parse(value);
};

export const coerceLabelGroup = (value: unknown): LabelGroup => {
  return labelGroupSchema.parse(value);
};

export const coerceLabelGroupFull = (value: unknown): LabelGroupFull => {
  return labelGroupFullSchema.parse(value);
};

export const coerceLabelGroupOptional = (
  value: unknown,
): LabelGroup | undefined => {
  return value == null ? undefined : coerceLabelGroup(value);
};

export const coerceLabelGroupNullable = (value: unknown): LabelGroup | null => {
  return value == null ? null : coerceLabelGroup(value);
};

export const coerceLabelStub = (value: unknown): LabelStub => {
  return labelStubSchema.parse(value);
};

export const coerceLabel = (value: unknown): Label => {
  return labelSchema.parse(value);
};

export const coerceLabelFull = (value: unknown): LabelFull => {
  return labelFullSchema.parse(value);
};

export const coerceLabelOptional = (value: unknown): Label | undefined => {
  return value == null ? undefined : coerceLabel(value);
};

export const coerceLabelNullable = (value: unknown): Label | null => {
  return value == null ? null : coerceLabel(value);
};

export const coerceSubscriberStub = (value: unknown): SubscriberStub => {
  return subscriberStubSchema.parse(value);
};

export const coerceSubscriber = (value: unknown): Subscriber => {
  return subscriberSchema.parse(value);
};

export const coerceSubscriberFull = (value: unknown): SubscriberFull => {
  return subscriberFullSchema.parse(value);
};

export const coerceSubscriberOptional = (
  value: unknown,
): Subscriber | undefined => {
  return value == null ? undefined : coerceSubscriber(value);
};

export const coerceSubscriberNullable = (value: unknown): Subscriber | null => {
  return value == null ? null : coerceSubscriber(value);
};

export const coerceThreadStub = (value: unknown): ThreadStub => {
  return threadStubSchema.parse(value);
};

export const coerceThread = (value: unknown): Thread => {
  return threadSchema.parse(value);
};

export const coerceThreadFull = (value: unknown): ThreadFull => {
  return threadFullSchema.parse(value);
};

export const coerceThreadOptional = (value: unknown): Thread | undefined => {
  return value == null ? undefined : coerceThread(value);
};

export const coerceThreadNullable = (value: unknown): Thread | null => {
  return value == null ? null : coerceThread(value);
};

export const coerceMessageStub = (value: unknown): MessageStub => {
  return messageStubSchema.parse(value);
};

export const coerceMessage = (value: unknown): Message => {
  return messageSchema.parse(value);
};

export const coerceMessageFull = (value: unknown): MessageFull => {
  return messageFullSchema.parse(value);
};

export const coerceMessageOptional = (value: unknown): Message | undefined => {
  return value == null ? undefined : coerceMessage(value);
};

export const coerceMessageNullable = (value: unknown): Message | null => {
  return value == null ? null : coerceMessage(value);
};
