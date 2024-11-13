/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { z } from 'zod';

export const payloadTypeSchema = z.enum(['location', 'attachments']);

// Define PayloadPattern schema
export const PayloadPatternSchema = z.object({
  label: z.string(),
  value: z.string(),
  type: payloadTypeSchema.optional(), // Optional field
});

export type PayloadPattern = z.infer<typeof PayloadPatternSchema>;

// Define NlpPattern schema
export const NlpPatternEntitySchema = z.object({
  entity: z.string(),
  match: z.literal('entity'),
});

export const NlpPatternValueSchema = z.object({
  entity: z.string(),
  match: z.literal('value'),
  value: z.string(),
});

export const NlpPatternSchema = z.union([
  NlpPatternEntitySchema,
  NlpPatternValueSchema,
]);

export type NlpPattern = z.infer<typeof NlpPatternSchema>;

// Define Pattern as a union of possible types
export const patternSchema = z.union([
  z.string(),
  z.instanceof(RegExp),
  PayloadPatternSchema,
  z.array(NlpPatternSchema),
]);

export type Pattern = z.infer<typeof patternSchema>;
