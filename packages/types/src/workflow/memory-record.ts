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

const isUserLike = (value: unknown): boolean => {
  const record = toRecord(value);
  if (!record) {
    return false;
  }

  return (
    "username" in record ||
    "email" in record ||
    "sendEmail" in record ||
    "roles" in record ||
    "roleIds" in record
  );
};
const parseUserOrSubscriber = (value: unknown): unknown => {
  return isUserLike(value)
    ? userSchema.parse(value)
    : subscriberSchema.parse(value);
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
  ttlSeconds: preprocess(
    (value) => (value === undefined ? undefined : value),
    z.coerce.number().nullable().optional(),
  ).optional(),
  expiresAt: preprocess(
    (value) => (value === undefined ? undefined : value),
    z.coerce.date().nullable().optional(),
  ).optional(),
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

export const memoryRecordFullSchema = preprocess(
  (value) => withAliases(value, memoryRecordAliasMap),
  memoryRecordStubObjectSchema.extend({
    definition: preprocess((value) => value, memoryDefinitionSchema),
    owner: preprocess(
      (value) => parseUserOrSubscriber(value),
      z.union([z.lazy(() => userSchema), subscriberSchema]),
    ),
    workflow: preprocess(
      (value) => (value == null ? null : value),
      workflowSchema.nullable(),
    ).optional(),
    run: preprocess(
      (value) => (value == null ? null : value),
      workflowRunSchema.nullable(),
    ).optional(),
    thread: preprocess(
      (value) => (value == null ? null : value),
      threadSchema.nullable(),
    ).optional(),
  }),
);

export type MemoryRecordStub = z.infer<typeof memoryRecordStubSchema>;

export type MemoryRecord = z.infer<typeof memoryRecordSchema>;

export type MemoryRecordFull = z.infer<typeof memoryRecordFullSchema>;
