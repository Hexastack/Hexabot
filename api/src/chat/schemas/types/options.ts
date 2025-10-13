/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
