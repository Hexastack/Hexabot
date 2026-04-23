/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { asId, withAliases } from "../shared/aliases";
import { baseStubSchema } from "../shared/base";
import { cloneWithPrototype, toRecord } from "../shared/object";
import { preprocess } from "../shared/preprocess";
import { userSchema } from "../user/user";

import { directionTypeSchema, workflowTypeSchema } from "./domain";
import { nullishToNull } from "./helpers";
import { workflowVersionSchema } from "./workflow-version";

export type WorkflowDefinitionParser = (definitionYml: string) => unknown;
const workflowAliasMap = {
  currentVersionId: "currentVersion",
  publishedVersionId: "publishedVersion",
  createdById: "createdBy",
} as const;
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
const workflowFullObjectSchema = workflowStubObjectSchema.extend({
  currentVersion: preprocess(
    (value) => (value == null ? null : value),
    z.lazy(() => workflowVersionSchema).nullable(),
  ),
  publishedVersion: preprocess(
    (value) => (value == null ? null : value),
    z.lazy(() => workflowVersionSchema).nullable(),
  ),
  createdBy: preprocess(
    (value) => (value == null ? null : value),
    z.lazy(() => userSchema).nullable(),
  ),
  definitionYml: preprocess(
    (value) => (value == null ? undefined : value),
    z.string().optional(),
  ).optional(),
  definition: preprocess(
    (value) => (value == null ? undefined : value),
    workflowDefinitionSchema.optional(),
  ).optional(),
});

export const workflowStubSchema = workflowStubObjectSchema;

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

export const createWorkflowFullSchema = (options?: {
  parseDefinition?: WorkflowDefinitionParser;
}) => {
  return preprocess(
    (value) => withWorkflowDerivedFields(value, options?.parseDefinition),
    workflowFullObjectSchema,
  );
};

export const workflowFullSchema = createWorkflowFullSchema();

export type WorkflowStub = z.infer<typeof workflowStubSchema>;

export type Workflow = z.infer<typeof workflowSchema>;

export type WorkflowFull = z.infer<typeof workflowFullSchema>;
