/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Workflow as AgenticWorkflow,
  type WorkflowDefinition,
} from '@hexabot-ai/agentic';
import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

import { ActionService } from '@/actions/actions.service';
import { RuntimeBindingsService } from '@/bindings/runtime-bindings.service';
import { workflowResourceRef } from '@/workflow/resource-refs';

import { WorkflowTransferDefinitionService } from './workflow-transfer-definition.service';

describe('WorkflowTransferDefinitionService', () => {
  let service: WorkflowTransferDefinitionService;
  let actionRegistry: ReturnType<ActionService['getRegistry']>;
  let bindingRegistry: ReturnType<RuntimeBindingsService['getRegistry']>;

  beforeEach(() => {
    actionRegistry = {
      custom_assign_resources: {
        supportedBindings: [],
        inputSchema: z.strictObject({
          labels_to_assign: z
            .array(z.string())
            .optional()
            .meta(workflowResourceRef('label')),
          labels_to_remove: z
            .array(z.string().meta(workflowResourceRef('label')))
            .optional(),
        }),
        settingSchema: z.strictObject({}),
      },
      custom_send_content: {
        supportedBindings: [],
        inputSchema: z.strictObject({
          content: z.strictObject({
            contentType: z
              .string()
              .optional()
              .meta(workflowResourceRef('contentType')),
          }),
        }),
        settingSchema: z.strictObject({}),
      },
      custom_retrieve_content: {
        supportedBindings: [],
        inputSchema: z.strictObject({}),
        settingSchema: z.strictObject({
          content_type_id: z
            .string()
            .optional()
            .meta(workflowResourceRef('contentType')),
        }),
      },
      custom_use_infra_resources: {
        supportedBindings: [],
        inputSchema: z.strictObject({}),
        settingSchema: z.strictObject({
          credential_id: z.string().meta(workflowResourceRef('credential')),
          server_id: z.string().meta(workflowResourceRef('mcpServer')),
          definition_id: z
            .string()
            .meta(workflowResourceRef('memoryDefinition')),
        }),
      },
    } as unknown as ReturnType<ActionService['getRegistry']>;
    bindingRegistry = {
      memory: {
        schema: z.strictObject({
          definition_id: z
            .string()
            .meta(workflowResourceRef('memoryDefinition')),
        }),
        multiple: true,
        color: '#0ea5e9',
        icon: 'Database',
      },
      mcp: {
        schema: z.strictObject({
          server_id: z.string().meta(workflowResourceRef('mcpServer')),
        }),
        multiple: true,
        color: '#14b8a6',
        icon: 'Plug',
      },
    };

    service = new WorkflowTransferDefinitionService(
      {
        getRegistry: jest.fn(() => actionRegistry),
      } as unknown as ActionService,
      {
        getRegistry: jest.fn(() => bindingRegistry),
      } as unknown as RuntimeBindingsService,
    );
  });

  it('parses definitions against the local binding and action catalogs', () => {
    const definition: WorkflowDefinition = {
      defs: {
        profile_memory: {
          kind: 'memory',
          settings: { definition_id: 'memory-export-id' },
        },
        assign_label: {
          kind: 'task',
          action: 'custom_assign_resources',
          inputs: { labels_to_assign: [] },
        },
      },
      flow: [],
      outputs: { ok: '=true' },
    };

    expect(
      service.parseWithLocalCatalog(
        AgenticWorkflow.stringifyDefinition(definition),
      ),
    ).toEqual(definition);

    expect(() =>
      service.parseWithLocalCatalog(
        AgenticWorkflow.stringifyDefinition({
          ...definition,
          defs: {
            missing_action: {
              kind: 'task',
              action: 'missing_action',
            },
          },
        } as WorkflowDefinition),
      ),
    ).toThrow(BadRequestException);
  });

  it('collects literal binding and task resource references only', () => {
    const definition: WorkflowDefinition = {
      defs: {
        profile_memory: {
          kind: 'memory',
          settings: { definition_id: 'memory-export-id' },
        },
        search_mcp: {
          kind: 'mcp',
          settings: { server_id: 'mcp-export-id' },
        },
        assign_label: {
          kind: 'task',
          action: 'custom_assign_resources',
          inputs: {
            labels_to_assign: [
              'label-export-id',
              ' label-export-id-2 ',
              '=$input.dynamicLabel',
              '',
            ],
            labels_to_remove: ['label-export-id'],
          },
        },
        send_content: {
          kind: 'task',
          action: 'custom_send_content',
          inputs: {
            content: {
              contentType: 'content-type-export-id',
            },
          },
        },
        retrieve_content: {
          kind: 'task',
          action: 'custom_retrieve_content',
          settings: {
            content_type_id: 'content-type-export-id-2',
          },
        },
        use_infra_resources: {
          kind: 'task',
          action: 'custom_use_infra_resources',
          settings: {
            credential_id: 'credential-export-id',
            server_id: 'task-mcp-export-id',
            definition_id: 'task-memory-export-id',
          },
        },
      },
      flow: [],
      outputs: {},
    };

    expect(service.collectBindingResourceRefs(definition)).toEqual({
      contentTypes: [],
      credentials: [],
      labels: [],
      mcpServers: ['mcp-export-id'],
      memoryDefinitions: ['memory-export-id'],
    });
    expect(service.collectTaskResourceRefs(definition)).toEqual({
      contentTypes: ['content-type-export-id', 'content-type-export-id-2'],
      credentials: ['credential-export-id'],
      labels: ['label-export-id', 'label-export-id-2'],
      mcpServers: ['task-mcp-export-id'],
      memoryDefinitions: ['task-memory-export-id'],
    });
  });

  it('remaps binding and task resource references without mutating expressions', () => {
    const definition: WorkflowDefinition = {
      defs: {
        profile_memory: {
          kind: 'memory',
          settings: { definition_id: 'memory-export-id' },
        },
        search_mcp: {
          kind: 'mcp',
          settings: { server_id: 'mcp-export-id' },
        },
        assign_label: {
          kind: 'task',
          action: 'custom_assign_resources',
          inputs: {
            labels_to_assign: ['label-export-id', '=$input.dynamicLabel'],
          },
        },
        send_content: {
          kind: 'task',
          action: 'custom_send_content',
          inputs: {
            content: {
              contentType: 'content-type-export-id',
            },
          },
        },
        retrieve_content: {
          kind: 'task',
          action: 'custom_retrieve_content',
          settings: {
            content_type_id: 'content-type-export-id',
          },
        },
        use_infra_resources: {
          kind: 'task',
          action: 'custom_use_infra_resources',
          settings: {
            credential_id: 'credential-export-id',
            server_id: 'task-mcp-export-id',
            definition_id: 'task-memory-export-id',
          },
        },
      },
      flow: [],
      outputs: {},
    };
    const remappedBindings = service.remapBindingResourceRefs(definition, {
      contentTypes: {},
      credentials: {},
      labels: {},
      mcpServers: { 'mcp-export-id': 'mcp-local-id' },
      memoryDefinitions: { 'memory-export-id': 'memory-local-id' },
    });
    const remapped = service.remapTaskResourceRefs(remappedBindings, {
      contentTypes: { 'content-type-export-id': 'content-type-local-id' },
      credentials: { 'credential-export-id': 'credential-local-id' },
      labels: { 'label-export-id': 'label-local-id' },
      mcpServers: { 'task-mcp-export-id': 'task-mcp-local-id' },
      memoryDefinitions: { 'task-memory-export-id': 'task-memory-local-id' },
    });
    const remappedDefs = remapped.defs as Record<
      string,
      { inputs?: unknown; settings?: unknown }
    >;
    const originalDefs = definition.defs as Record<
      string,
      { inputs?: unknown; settings?: unknown }
    >;

    expect(remapped).not.toBe(definition);
    expect(remappedDefs.profile_memory.settings).toEqual({
      definition_id: 'memory-local-id',
    });
    expect(remappedDefs.search_mcp.settings).toEqual({
      server_id: 'mcp-local-id',
    });
    expect(remappedDefs.assign_label.inputs).toEqual({
      labels_to_assign: ['label-local-id', '=$input.dynamicLabel'],
    });
    expect(remappedDefs.send_content.inputs).toEqual({
      content: {
        contentType: 'content-type-local-id',
      },
    });
    expect(remappedDefs.retrieve_content.settings).toEqual({
      content_type_id: 'content-type-local-id',
    });
    expect(remappedDefs.use_infra_resources.settings).toEqual({
      credential_id: 'credential-local-id',
      server_id: 'task-mcp-local-id',
      definition_id: 'task-memory-local-id',
    });
    expect(originalDefs.profile_memory.settings).toEqual({
      definition_id: 'memory-export-id',
    });
  });

  it('returns the original definition when task resource ids do not change', () => {
    const definition: WorkflowDefinition = {
      defs: {
        assign_label: {
          kind: 'task',
          action: 'custom_assign_resources',
          inputs: {
            labels_to_assign: ['=$input.dynamicLabel'],
          },
        },
      },
      flow: [],
      outputs: {},
    };

    expect(
      service.remapTaskResourceRefs(definition, {
        contentTypes: {},
        credentials: {},
        labels: {},
        mcpServers: {},
        memoryDefinitions: {},
      }),
    ).toBe(definition);
  });
});
