/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BindingKindDescriptor } from '@hexabot-ai/agentic';
import z from 'zod';

import { createBindingKind } from '@/bindings/create-binding-kind';

export const aiToolBindingSchema = z.strictObject({
  action: z.string().min(1),
  settings: z.record(z.string(), z.unknown()).optional(),
});

declare global {
  interface RuntimeBindingKindRegistry {
    tools: BindingKindDescriptor<typeof aiToolBindingSchema, true>;
  }
}

export const ToolsBindingKind = createBindingKind({
  kind: 'tools',
  schema: aiToolBindingSchema,
  multiple: true,
});

export default ToolsBindingKind;
