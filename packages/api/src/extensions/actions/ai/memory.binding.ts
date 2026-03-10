/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BindingKindDescriptor } from '@hexabot-ai/agentic';
import z from 'zod';

import { createBindingKind } from '@/bindings/create-binding-kind';

export const aiMemoryBindingSchema = z.strictObject({
  definition_id: z
    .string()
    .uuid()
    .meta({
      title: 'Memory definition',
      description:
        'Select a memory definition that can be mounted into AI action memory bindings.',
      'ui:widget': 'AutoCompleteWidget',
      'ui:options': {
        entity: 'MemoryDefinition',
        valueKey: 'id',
        labelKey: 'name',
      },
    }),
});

declare global {
  interface RuntimeBindingKindRegistry {
    memory: BindingKindDescriptor<typeof aiMemoryBindingSchema, true>;
  }
}

export const MemoryBindingKind = createBindingKind({
  kind: 'memory',
  schema: aiMemoryBindingSchema,
  multiple: true,
});

export default MemoryBindingKind;
