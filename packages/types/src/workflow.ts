/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { subscriberSchema, threadSchema } from "./chat";
import { asId, baseStubSchema, preprocess, withAliases } from "./fragments";
import {
  directionTypeSchema,
  memoryScopeSchema,
  mcpServerTransportSchema,
  workflowTypeSchema,
  workflowVersionActionSchema,
} from "./primitives";
import { userSchema } from "./user";
import { credentialSchema } from "./user-access";

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};
const cloneWithPrototype = (
  value: Record<string, unknown>,
): Record<string, unknown> => {
  return Object.assign(Object.create(Object.getPrototypeOf(value)), value);
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

export type WorkflowDefinitionParser = (definitionYml: string) => unknown;

const nullishToNull = (value: unknown): unknown => {
  return value == null ? null : value;
};
const workflowVersionAliasMap = {
  parentVersionId: "parentVersion",
  workflowId: "workflow",
  createdById: "createdBy",
} as const;
const workflowAliasMap = {
  currentVersionId: "currentVersion",
  publishedVersionId: "publishedVersion",
  createdById: "createdBy",
} as const;
const workflowRunAliasMap = {
  workflowId: "workflow",
  workflowVersionId: "workflowVersion",
  triggeredById: "triggeredBy",
  threadId: "thread",
} as const;
const memoryRecordAliasMap = {
  definitionId: "definition",
  ownerId: "owner",
  workflowId: "workflow",
  runId: "run",
  threadId: "thread",
} as const;
const mcpServerAliasMap = {
  credentialId: "credential",
} as const;
const workflowVersionStubObjectSchema = baseStubSchema.extend({
  version: z.coerce.number(),
  definitionYml: z.string(),
  checksum: z.string(),
  message: preprocess(nullishToNull, z.string().nullable()),
  action: preprocess(nullishToNull, workflowVersionActionSchema.nullable()),
});
const workflowStubObjectSchema = baseStubSchema.extend({
  name: z.string(),
  description: preprocess(nullishToNull, z.string().nullable()),
  type: workflowTypeSchema,
  schedule: preprocess(nullishToNull, z.string().nullable()),
  inputSchema: z.any(),
  builtin: z.coerce.boolean(),
  x: z.coerce.number(),
  y: z.coerce.number(),
  zoom: z.coerce.number(),
  direction: directionTypeSchema,
});
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
const memoryDefinitionObjectSchema = baseStubSchema.extend({
  name: z.string(),
  slug: z.string(),
  scope: memoryScopeSchema,
  schema: z.any(),
  ttlSeconds: preprocess(
    (value) => (value === undefined ? undefined : value),
    z.coerce.number().nullable().optional(),
  ).optional(),
});
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
const mcpServerStubObjectSchema = baseStubSchema.extend({
  name: z.string(),
  enabled: z.coerce.boolean(),
  transport: mcpServerTransportSchema,
  url: preprocess(
    (value) => (value == null ? null : value),
    z.string().nullable(),
  ),
  command: preprocess(
    (value) => (value == null ? null : value),
    z.string().nullable(),
  ),
  args: preprocess(
    (value) => (value == null ? null : value),
    z.array(z.string()).nullable(),
  ),
  cwd: preprocess(
    (value) => (value == null ? null : value),
    z.string().nullable(),
  ),
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
const withWorkflowDerivedFields = (
  value: unknown,
  parseDefinition?: WorkflowDefinitionParser,
): unknown => {
  const record = toRecord(value);
  if (!record) {
    return value;
  }

  const next = cloneWithPrototype(record);
  const currentVersion = toRecord(next.currentVersion);
  const currentDefinitionYml =
    typeof next.definitionYml === "string"
      ? next.definitionYml
      : typeof currentVersion?.definitionYml === "string"
        ? currentVersion.definitionYml
        : undefined;

  if (next.definitionYml === undefined && currentDefinitionYml !== undefined) {
    next.definitionYml = currentDefinitionYml;
  }

  if (
    next.definition === undefined &&
    typeof currentDefinitionYml === "string" &&
    currentDefinitionYml.trim() !== "" &&
    parseDefinition
  ) {
    next.definition = parseDefinition(currentDefinitionYml);
  }

  return next;
};
const withWorkflowAliases = (value: unknown): unknown => {
  const original = toRecord(value);
  const aliased = withAliases(value, workflowAliasMap);
  const record = toRecord(aliased);
  if (!record) {
    return aliased;
  }

  const next = cloneWithPrototype(record);
  const hasExplicitCurrentVersion = !!original && "currentVersion" in original;
  const hasExplicitPublishedVersion =
    !!original && "publishedVersion" in original;
  const hasCurrentVersion = next.currentVersion != null;
  if (!hasExplicitCurrentVersion && next.currentVersion == null) {
    delete next.currentVersion;
  }
  if (
    !hasExplicitPublishedVersion &&
    next.publishedVersion == null &&
    !hasCurrentVersion
  ) {
    delete next.publishedVersion;
  }

  return next;
};
const workflowDefinitionSchema = z.any();

export const workflowVersionStubSchema = workflowVersionStubObjectSchema;

export const workflowStubSchema = workflowStubObjectSchema;

export const workflowVersionSchema = preprocess(
  (value) => withAliases(value, workflowVersionAliasMap),
  workflowVersionStubObjectSchema.extend({
    parentVersion: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string().nullable(),
    ),
    workflow: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string(),
    ),
    createdBy: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string().nullable(),
    ),
  }),
);

export const workflowSchema = preprocess(
  withWorkflowAliases,
  workflowStubObjectSchema.extend({
    currentVersion: preprocess(
      (value) =>
        value === undefined ? undefined : value == null ? null : asId(value),
      z.string().nullable().optional(),
    ).optional(),
    publishedVersion: preprocess(
      (value) =>
        value === undefined ? undefined : value == null ? null : asId(value),
      z.string().nullable().optional(),
    ).optional(),
    createdBy: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string().nullable(),
    ),
    runAfterMs: preprocess(
      (value) => (value == null ? 0 : value),
      z.coerce.number(),
    ),
  }),
);

const workflowFullObjectSchema = preprocess(
  (value) => withAliases(value, workflowAliasMap),
  workflowStubObjectSchema.extend({
    currentVersion: preprocess(
      (value) => (value == null ? null : value),
      workflowVersionSchema.nullable(),
    ),
    publishedVersion: preprocess(
      (value) => (value == null ? null : value),
      workflowVersionSchema.nullable(),
    ),
    createdBy: preprocess(
      (value) => (value == null ? null : value),
      userSchema.nullable(),
    ),
    definitionYml: preprocess(
      (value) => (value == null ? undefined : value),
      z.string().optional(),
    ).optional(),
    definition: preprocess(
      (value) => (value == null ? undefined : value),
      workflowDefinitionSchema.optional(),
    ).optional(),
  }),
);

export const createWorkflowFullSchema = (options?: {
  parseDefinition?: WorkflowDefinitionParser;
}) => {
  return preprocess(
    (value) => withWorkflowDerivedFields(value, options?.parseDefinition),
    workflowFullObjectSchema,
  );
};

export const workflowFullSchema = createWorkflowFullSchema();

export const workflowVersionFullSchema = preprocess(
  (value) => withAliases(value, workflowVersionAliasMap),
  workflowVersionStubObjectSchema.extend({
    parentVersion: preprocess(nullishToNull, workflowVersionSchema.nullable()),
    workflow: preprocess((value) => value, workflowSchema),
    createdBy: preprocess(
      (value) => (value == null ? null : value),
      userSchema.nullable(),
    ),
  }),
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

const userOrSubscriberSchema = preprocess(
  (value) => (value == null ? null : parseUserOrSubscriber(value)),
  z.union([userSchema, subscriberSchema]).nullable(),
);

export const workflowRunFullSchema = preprocess(
  (value) => withAliases(withWorkflowRunDuration(value), workflowRunAliasMap),
  workflowRunStubObjectSchema.extend({
    workflow: preprocess((value) => value, workflowSchema),
    workflowVersion: preprocess(
      (value) => (value == null ? null : value),
      workflowVersionSchema.nullable(),
    ).optional(),
    triggeredBy: userOrSubscriberSchema,
    thread: preprocess(
      (value) => (value == null ? null : value),
      threadSchema.nullable(),
    ).optional(),
  }),
);

export const memoryDefinitionStubSchema = memoryDefinitionObjectSchema;

export const memoryDefinitionSchema = memoryDefinitionObjectSchema;

export const memoryDefinitionFullSchema = memoryDefinitionObjectSchema;

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
      z.union([userSchema, subscriberSchema]),
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

export const mcpServerStubSchema = mcpServerStubObjectSchema;

export const mcpServerSchema = preprocess(
  (value) => withAliases(value, mcpServerAliasMap),
  mcpServerStubObjectSchema.extend({
    credential: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string().nullable(),
    ),
  }),
);

export const mcpServerFullSchema = preprocess(
  (value) => withAliases(value, mcpServerAliasMap),
  mcpServerStubObjectSchema.extend({
    credential: preprocess(
      (value) => (value == null ? null : credentialSchema.parse(value)),
      credentialSchema.nullable(),
    ).optional(),
  }),
);

export type WorkflowVersionStub = z.infer<typeof workflowVersionStubSchema>;

export type WorkflowVersion = z.infer<typeof workflowVersionSchema>;

export type WorkflowVersionFull = z.infer<typeof workflowVersionFullSchema>;

export type WorkflowStub = z.infer<typeof workflowStubSchema>;

export type Workflow = z.infer<typeof workflowSchema>;

export type WorkflowFull = z.infer<typeof workflowFullSchema>;

export type WorkflowRunStub = z.infer<typeof workflowRunStubSchema>;

export type WorkflowRun = z.infer<typeof workflowRunSchema>;

export type WorkflowRunFull = z.infer<typeof workflowRunFullSchema>;

export type MemoryDefinitionStub = z.infer<typeof memoryDefinitionStubSchema>;

export type MemoryDefinition = z.infer<typeof memoryDefinitionSchema>;

export type MemoryDefinitionFull = z.infer<typeof memoryDefinitionFullSchema>;

export type MemoryRecordStub = z.infer<typeof memoryRecordStubSchema>;

export type MemoryRecord = z.infer<typeof memoryRecordSchema>;

export type MemoryRecordFull = z.infer<typeof memoryRecordFullSchema>;

export type McpServerStub = z.infer<typeof mcpServerStubSchema>;

export type McpServer = z.infer<typeof mcpServerSchema>;

export type McpServerFull = z.infer<typeof mcpServerFullSchema>;
