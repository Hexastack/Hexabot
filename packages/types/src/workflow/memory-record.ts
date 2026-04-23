/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { subscriberSchema } from "../chat/subscriber";
import { threadSchema } from "../chat/thread";
import { asId, withAliases } from "../shared/aliases";
import { baseStubSchema } from "../shared/base";
import { toRecord } from "../shared/object";
import { preprocess } from "../shared/preprocess";
import { userSchema } from "../user/user";

import { memoryDefinitionSchema } from "./memory-definition";
import { workflowSchema } from "./workflow";
import { workflowRunSchema } from "./workflow-run";

const parseUserOrSubscriber = (value: unknown): unknown => {
  const record = toRecord(value);

  if (record?.type === "UserOrmEntity") {
    return userSchema.parse(value);
  }
  if (record?.type === "SubscriberOrmEntity") {
    return subscriberSchema.parse(value);
  }

  const parsedUser = userSchema.safeParse(value);
  if (parsedUser.success) {
    return parsedUser.data;
  }

  return subscriberSchema.parse(value);
};
const memoryRecordAliasMap = {
  definitionId: "definition",
  ownerId: "owner",
  workflowId: "workflow",
  runId: "run",
  threadId: "thread",
} as const;
const memoryRecordStubObjectSchema = baseStubSchema.extend({
  value: z.record(z.string(), z.unknown()),
  ttlSeconds: z.coerce.number().nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
});

export const memoryRecordStubSchema = memoryRecordStubObjectSchema;

export const memoryRecordSchema = preprocess(
  (value) => withAliases(value, memoryRecordAliasMap),
  memoryRecordStubObjectSchema.extend({
    definition: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string(),
    ),
    owner: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string(),
    ),
    workflow: preprocess(
      (value) => (value == null ? undefined : asId(value)),
      z.string().optional(),
    ).optional(),
    run: preprocess(
      (value) => (value == null ? undefined : asId(value)),
      z.string().optional(),
    ).optional(),
    thread: preprocess(
      (value) => (value == null ? undefined : asId(value)),
      z.string().optional(),
    ).optional(),
  }),
);

export const memoryRecordFullSchema = memoryRecordStubObjectSchema.extend({
  definition: memoryDefinitionSchema,
  owner: preprocess(
    (value) => parseUserOrSubscriber(value),
    z.union([z.lazy(() => userSchema), subscriberSchema]),
  ),
  workflow: workflowSchema.nullable().optional(),
  run: workflowRunSchema.nullable().optional(),
  thread: threadSchema.nullable().optional(),
});

export type MemoryRecordStub = z.infer<typeof memoryRecordStubSchema>;

export type MemoryRecord = z.infer<typeof memoryRecordSchema>;

export type MemoryRecordFull = z.infer<typeof memoryRecordFullSchema>;
