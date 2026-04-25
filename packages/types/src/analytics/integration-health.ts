/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

export const integrationHealthStatusSchema = z.enum([
  "healthy",
  "warning",
  "unhealthy",
  "disabled",
]);

export const integrationHealthKindSchema = z.enum(["channel", "service"]);

export const integrationHealthItemSchema = z.object({
  id: z.string(),
  kind: integrationHealthKindSchema,
  name: z.string(),
  status: integrationHealthStatusSchema,
  checkedAt: z.string().datetime({ offset: true }),
  reason: z.string().optional(),
  message: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const integrationHealthResponseSchema = z.object({
  checkedAt: z.string().datetime({ offset: true }),
  integrations: z.array(integrationHealthItemSchema),
});

export type IntegrationHealthStatus = z.infer<
  typeof integrationHealthStatusSchema
>;

export type IntegrationHealthKind = z.infer<typeof integrationHealthKindSchema>;

export type IntegrationHealthItem = z.infer<typeof integrationHealthItemSchema>;

export type IntegrationHealthResponse = z.infer<
  typeof integrationHealthResponseSchema
>;
