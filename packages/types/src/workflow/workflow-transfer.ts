/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import {
  directionTypeSchema,
  mcpServerTransportSchema,
  memoryScopeSchema,
  workflowTypeSchema,
} from "./domain";
import { workflowSchema } from "./workflow";

export const WORKFLOW_EXPORT_BUNDLE_KIND = "hexabot.workflow.bundle";

export const WORKFLOW_TRANSFER_RESOURCE_KIND_PATTERN =
  /^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$/;

export const workflowTransferResourceKindSchema = z
  .string()
  .min(1)
  .regex(WORKFLOW_TRANSFER_RESOURCE_KIND_PATTERN);

const workflowExportBundleLayoutSchema = z.strictObject({
  x: z.coerce.number(),
  y: z.coerce.number(),
  zoom: z.coerce.number(),
  direction: directionTypeSchema,
});
const workflowExportBundleWorkflowSchema = z.strictObject({
  name: z.string().min(1),
  description: z.string().nullable(),
  type: workflowTypeSchema,
  schedule: z.string().nullable(),
  inputSchema: z.any(),
  layout: workflowExportBundleLayoutSchema,
});
const workflowExportBundleVersionSchema = z.strictObject({
  number: z.coerce.number(),
  checksum: z.string(),
  message: z.string().nullable(),
  exportedVersionId: z.string().min(1),
});

export const workflowExportBundleMemoryDefinitionSchema = z.strictObject({
  exportId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  scope: memoryScopeSchema,
  schema: z.any(),
  ttlSeconds: z.coerce.number().nullable().optional(),
});

export const workflowExportBundleCredentialSchema = z.strictObject({
  exportId: z.string().min(1),
  name: z.string().min(1),
  exportedOwnerId: z.string().optional(),
});

export const workflowExportBundleMcpServerSchema = z.strictObject({
  exportId: z.string().min(1),
  name: z.string().min(1),
  enabled: z.coerce.boolean(),
  transport: mcpServerTransportSchema,
  url: z.string().nullable(),
  command: z.string().nullable(),
  args: z.array(z.string()).nullable(),
  cwd: z.string().nullable(),
  credentialExportId: z.string().nullable().optional(),
});

export const workflowExportBundleContentTypeSchema = z.strictObject({
  exportId: z.string().min(1),
  name: z.string().min(1),
  schema: z.any(),
});

export const workflowExportBundleLabelGroupSchema = z.strictObject({
  exportId: z.string().min(1),
  name: z.string().min(1),
});

export const workflowExportBundleLabelSchema = z.strictObject({
  exportId: z.string().min(1),
  title: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  groupExportId: z.string().nullable(),
});

const workflowExportBundleResourcesSchema = z
  .object({
    memoryDefinitions: z.array(workflowExportBundleMemoryDefinitionSchema),
    mcpServers: z.array(workflowExportBundleMcpServerSchema),
    credentials: z.array(workflowExportBundleCredentialSchema),
    contentTypes: z.array(workflowExportBundleContentTypeSchema).default([]),
    labelGroups: z.array(workflowExportBundleLabelGroupSchema).default([]),
    labels: z.array(workflowExportBundleLabelSchema).default([]),
  })
  .catchall(z.array(z.unknown()));

export const workflowExportBundleV1Schema = z.strictObject({
  kind: z.literal(WORKFLOW_EXPORT_BUNDLE_KIND),
  schemaVersion: z.literal(1),
  exportedAt: z.iso.datetime(),
  workflow: workflowExportBundleWorkflowSchema,
  version: workflowExportBundleVersionSchema,
  definitionYml: z.string().min(1),
  resources: workflowExportBundleResourcesSchema,
});

export const workflowExportBundleSchema = workflowExportBundleV1Schema;

export const workflowImportResourceActionSchema = z.enum([
  "created",
  "reused",
  "placeholder_created",
]);

export const workflowImportResourceResultSchema = z.strictObject({
  kind: workflowTransferResourceKindSchema,
  exportId: z.string().min(1),
  localId: z.string().min(1),
  name: z.string().min(1),
  action: workflowImportResourceActionSchema,
});

export const workflowImportResultSchema = z.strictObject({
  workflow: workflowSchema,
  resources: z.array(workflowImportResourceResultSchema),
  warnings: z.array(z.string()),
});

export type WorkflowExportBundleMemoryDefinition = z.infer<
  typeof workflowExportBundleMemoryDefinitionSchema
>;

export type WorkflowExportBundleCredential = z.infer<
  typeof workflowExportBundleCredentialSchema
>;

export type WorkflowExportBundleMcpServer = z.infer<
  typeof workflowExportBundleMcpServerSchema
>;

export type WorkflowExportBundleContentType = z.infer<
  typeof workflowExportBundleContentTypeSchema
>;

export type WorkflowExportBundleLabelGroup = z.infer<
  typeof workflowExportBundleLabelGroupSchema
>;

export type WorkflowExportBundleLabel = z.infer<
  typeof workflowExportBundleLabelSchema
>;

export type WorkflowExportBundleV1 = z.infer<
  typeof workflowExportBundleV1Schema
>;

export type WorkflowExportBundle = z.infer<typeof workflowExportBundleSchema>;

export type WorkflowImportResourceAction = z.infer<
  typeof workflowImportResourceActionSchema
>;

export type WorkflowImportResourceResult = z.infer<
  typeof workflowImportResourceResultSchema
>;

export type WorkflowImportResult = z.infer<typeof workflowImportResultSchema>;
