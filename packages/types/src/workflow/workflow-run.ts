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
import { cloneWithPrototype, toRecord } from "../shared/object";
import { preprocess } from "../shared/preprocess";
import { userSchema } from "../user/user";

import { workflowSchema } from "./workflow";
import { workflowVersionSchema } from "./workflow-version";

const workflowRunStatusSchema = z.enum([
  "idle",
  "running",
  "suspended",
  "finished",
  "failed",
]);
const resolveTimestampMs = (value?: Date | string | null): number | null => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
};

export const resolveRunDurationMs = (run: {
  createdAt?: Date | string | null;
  finishedAt?: Date | string | null;
  failedAt?: Date | string | null;
  suspendedAt?: Date | string | null;
  status?: z.infer<typeof workflowRunStatusSchema> | null;
}): number | null => {
  const createdAtMs = resolveTimestampMs(run.createdAt);
  if (createdAtMs == null) {
    return null;
  }

  const endAtMs =
    resolveTimestampMs(run.finishedAt) ??
    resolveTimestampMs(run.failedAt) ??
    resolveTimestampMs(run.suspendedAt) ??
    (run.status === "running" ? Date.now() : null);

  if (endAtMs == null) {
    return null;
  }

  return Math.max(0, endAtMs - createdAtMs);
};

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
const nullishToNull = (value: unknown): unknown => {
  return value == null ? null : value;
};
const workflowRunAliasMap = {
  workflowId: "workflow",
  workflowVersionId: "workflowVersion",
  triggeredById: "triggeredBy",
  threadId: "thread",
} as const;
const workflowRunStubObjectSchema = baseStubSchema.extend({
  status: workflowRunStatusSchema,
  input: preprocess(nullishToNull, z.record(z.string(), z.any()).nullable()),
  output: preprocess(nullishToNull, z.record(z.string(), z.any()).nullable()),
  context: preprocess(
    (value) => (value == null ? {} : value),
    z.record(z.string(), z.any()),
  ),
  snapshot: preprocess(nullishToNull, z.any().nullable()),
  stepLog: preprocess(nullishToNull, z.record(z.string(), z.any()).nullable()),
  suspendedStep: preprocess(nullishToNull, z.string().nullable()),
  suspensionReason: preprocess(nullishToNull, z.string().nullable()),
  suspensionData: preprocess(nullishToNull, z.unknown().nullable()),
  suspensionStepExecId: preprocess(nullishToNull, z.string().nullable()),
  suspensionIndex: preprocess(nullishToNull, z.coerce.number().nullable()),
  suspensionKey: preprocess(nullishToNull, z.string().nullable()),
  suspensionAwaitResults: preprocess(
    nullishToNull,
    z.record(z.string(), z.any()).nullable(),
  ),
  lastResumeData: preprocess(nullishToNull, z.unknown().nullable()),
  error: preprocess(nullishToNull, z.string().nullable()),
  suspendedAt: preprocess(nullishToNull, z.coerce.date().nullable()),
  finishedAt: preprocess(nullishToNull, z.coerce.date().nullable()),
  failedAt: preprocess(nullishToNull, z.coerce.date().nullable()),
  duration: preprocess(nullishToNull, z.coerce.number().nullable()),
  metadata: preprocess(nullishToNull, z.record(z.string(), z.any()).nullable()),
});
const withWorkflowRunDuration = (value: unknown): unknown => {
  const record = toRecord(value);
  if (!record) {
    return value;
  }

  const next = cloneWithPrototype(record);
  next.duration = resolveRunDurationMs(next as never);

  return next;
};
const userOrSubscriberSchema = preprocess(
  (value) => (value == null ? null : parseUserOrSubscriber(value)),
  z.union([z.lazy(() => userSchema), subscriberSchema]).nullable(),
);

export const workflowRunStubSchema = preprocess(
  withWorkflowRunDuration,
  workflowRunStubObjectSchema,
);

export const workflowRunSchema = preprocess(
  (value) => withAliases(withWorkflowRunDuration(value), workflowRunAliasMap),
  workflowRunStubObjectSchema.extend({
    workflow: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string(),
    ),
    workflowVersion: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string().nullable(),
    ),
    triggeredBy: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string().nullable(),
    ),
  }),
);

export const workflowRunFullSchema = preprocess(
  (value) => withAliases(withWorkflowRunDuration(value), workflowRunAliasMap),
  workflowRunStubObjectSchema.extend({
    workflow: preprocess((value) => value, workflowSchema),
    workflowVersion: preprocess(
      (value) => (value == null ? null : value),
      z.lazy(() => workflowVersionSchema).nullable(),
    ).optional(),
    triggeredBy: userOrSubscriberSchema,
    thread: preprocess(
      (value) => (value == null ? null : value),
      threadSchema.nullable(),
    ).optional(),
  }),
);

export type WorkflowRunStub = z.infer<typeof workflowRunStubSchema>;

export type WorkflowRun = z.infer<typeof workflowRunSchema>;

export type WorkflowRunFull = z.infer<typeof workflowRunFullSchema>;
