/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { asId, withAliases } from "../shared/aliases";
import { baseStubSchema } from "../shared/base";
import { preprocess } from "../shared/preprocess";
import { userSchema } from "../user/user";

import { subscriberSchema } from "./subscriber";
import { threadSchema } from "./thread";

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
  mid: z.string().optional(),
  message: messagePayloadSchema,
  read: z.coerce.boolean(),
  delivery: z.coerce.boolean(),
  handover: z.coerce.boolean(),
});

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

export const messageFullSchema = messageStubObjectSchema.extend({
  sender: subscriberSchema.nullable().optional(),
  recipient: subscriberSchema.nullable().optional(),
  sentBy: z
    .lazy(() => userSchema)
    .nullable()
    .optional(),
  thread: threadSchema,
});

export type MessageStub = z.infer<typeof messageStubSchema>;

export type Message = z.infer<typeof messageSchema>;

export type MessageFull = z.infer<typeof messageFullSchema>;
