/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { z } from 'zod';

import { buttonSchema } from './button';

export const contentOptionsSchema = z.object({
  display: z.enum(['list', 'carousel']),
  fields: z.object({
    title: z.string(),
    subtitle: z.string().nullable(),
    image_url: z.string().nullable(),
    url: z.string().optional(),
    action_title: z.string().optional(),
    action_payload: z.string().optional(),
  }),
  buttons: z.array(buttonSchema),
  limit: z.number().finite(),
  query: z.any().optional(),
  entity: z.string().optional(),
  top_element_style: z.enum(['large', 'compact']).optional(),
});

export type ContentOptions = z.infer<typeof contentOptionsSchema>;

export const fallbackOptionsSchema = z.object({
  active: z.boolean(),
  message: z.array(z.string()),
  max_attempts: z.number().finite(),
});

export type FallbackOptions = z.infer<typeof fallbackOptionsSchema>;

export const BlockOptionsSchema = z.object({
  typing: z.number().optional(),
  content: contentOptionsSchema.optional(),
  fallback: fallbackOptionsSchema.optional(),
  assignTo: z.string().optional(),
  effects: z.array(z.string()).optional(),
});

export type BlockOptions = z.infer<typeof BlockOptionsSchema>;
