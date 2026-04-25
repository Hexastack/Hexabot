/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { baseStubSchema } from "../shared/base";
import { preprocess } from "../shared/preprocess";

const nullableRecordSchema = preprocess(
  (value) => (value == null ? null : value),
  z.unknown().nullable(),
);

export const auditLogSchema = baseStubSchema.extend({
  resourceId: z.string(),
  resourceType: z.string(),
  resourceLabel: z.string().nullable(),
  operationId: z.string(),
  operationType: z.string(),
  operationStatus: z.enum(["UNSPECIFIED", "SUCCEEDED", "FAILED"]),
  actorId: z.string(),
  actorType: z.string(),
  actorLabel: z.string().nullable(),
  actorIp: z.string().nullable(),
  actorAgent: z.string().nullable(),
  requestId: z.string().nullable(),
  requestMethod: z.string().nullable(),
  requestPath: z.string().nullable(),
  dataBefore: nullableRecordSchema,
  dataAfter: nullableRecordSchema,
  dataDiff: nullableRecordSchema,
  raw: nullableRecordSchema,
});

export const auditLogFullSchema = auditLogSchema;

export type AuditLog = z.infer<typeof auditLogSchema>;

export type AuditLogFull = z.infer<typeof auditLogFullSchema>;
