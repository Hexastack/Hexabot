/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { z } from 'zod';

import { PayloadType } from './button';

export const payloadPatternSchema = z.object({
  label: z.string(),
  value: z.string(),
  type: z.nativeEnum(PayloadType).optional(),
});

export type PayloadPattern = z.infer<typeof payloadPatternSchema>;

export const nlpPatternSchema = z.discriminatedUnion('match', [
  z.object({
    entity: z.string(),
    match: z.literal('entity'),
  }),
  z.object({
    entity: z.string(),
    match: z.literal('value'),
    value: z.string(),
  }),
]);

export type NlpPattern = z.infer<typeof nlpPatternSchema>;

export const patternSchema = z.union([
  z.string(),
  z.instanceof(RegExp),
  payloadPatternSchema,
  z.array(nlpPatternSchema),
]);

export type Pattern = z.infer<typeof patternSchema>;
