/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BindingKindDescriptor } from '@hexabot-ai/agentic';
import z from 'zod';

import { createBindingKind } from '@/bindings/create-binding-kind';

export const aiMcpToolBindingSchema = z.strictObject({
  server_id: z.uuid().meta({
    title: 'MCP server',
    description: 'Select the MCP server used to resolve tool definitions.',
    'ui:widget': 'AutoCompleteWidget',
    'ui:options': {
      entity: 'McpServer',
      valueKey: 'id',
      labelKey: 'name',
      enableEntityAddButton: true,
    },
  }),
  tool_names: z
    .array(z.string().trim().min(1))
    .optional()
    .meta({
      title: 'Tool names',
      description:
        'Optional allow-list of MCP tool names. Leave empty to expose all server tools.',
      'ui:widget': 'AutoCompleteWidget',
      'ui:options': {
        methodName: 'getMcpTools',
        labelKey: 'name',
        idKey: 'name',
        idFormPath: 'server_id',
        disableSearch: true,
        multiple: true,
      },
    }),
});

declare global {
  interface RuntimeBindingKindRegistry {
    mcp: BindingKindDescriptor<typeof aiMcpToolBindingSchema, true>;
  }
}

export const McpToolsBindingKind = createBindingKind({
  kind: 'mcp',
  schema: aiMcpToolBindingSchema,
  multiple: true,
  actionPolicy: 'forbidden',
  color: '#14b8a6',
  icon: 'Plug',
});

export default McpToolsBindingKind;
