/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { WorkflowDefinition } from '../dsl.types';
import {
  collectWorkflowDefinitionResourceRefs,
  remapWorkflowDefinitionResourceRefs,
  type WorkflowDefinitionResourceDescriptor,
} from '../utils/workflow-definition-resources';

const descriptors: WorkflowDefinitionResourceDescriptor[] = [
  { kind: 'memory', settingsKey: 'definition_id' },
  { kind: 'mcp', settingsKey: 'server_id' },
];
const definition: WorkflowDefinition = {
  defs: {
    profile_memory: {
      kind: 'memory',
      settings: {
        definition_id: 'memory-1',
      },
    },
    duplicate_profile_memory: {
      kind: 'memory',
      settings: {
        definition_id: 'memory-1',
      },
    },
    search_mcp: {
      kind: 'mcp',
      settings: {
        server_id: 'mcp-1',
      },
    },
    greet: {
      kind: 'task',
      action: 'send_message',
      bindings: {
        memory: ['profile_memory'],
        mcp: ['search_mcp'],
      },
    },
  },
  flow: [{ do: 'greet' }],
  outputs: { result: '=$output.greet' },
};

describe('workflow definition resource helpers', () => {
  it('collects unique resource references by descriptor kind', () => {
    expect(
      collectWorkflowDefinitionResourceRefs(definition, descriptors),
    ).toEqual({
      memory: ['memory-1'],
      mcp: ['mcp-1'],
    });
  });

  it('remaps resource references without mutating the original definition', () => {
    const updated = remapWorkflowDefinitionResourceRefs(
      definition,
      descriptors,
      {
        memory: { 'memory-1': 'memory-local' },
        mcp: { 'mcp-1': 'mcp-local' },
      },
    );

    expect(updated).not.toBe(definition);
    expect(updated.defs.profile_memory.settings).toEqual({
      definition_id: 'memory-local',
    });
    expect(updated.defs.duplicate_profile_memory.settings).toEqual({
      definition_id: 'memory-local',
    });
    expect(updated.defs.search_mcp.settings).toEqual({
      server_id: 'mcp-local',
    });
    expect(definition.defs.profile_memory.settings).toEqual({
      definition_id: 'memory-1',
    });
    expect(definition.defs.search_mcp.settings).toEqual({
      server_id: 'mcp-1',
    });
  });

  it('returns the original definition when no refs change', () => {
    expect(
      remapWorkflowDefinitionResourceRefs(definition, descriptors, {
        memory: {},
        mcp: {},
      }),
    ).toBe(definition);
  });
});
