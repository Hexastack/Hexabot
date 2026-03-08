/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowDefinitionSchema } from '../dsl.types';

describe('WorkflowDefinitionSchema', () => {
  it('parses a minimal valid workflow', () => {
    const minimal = {
      tasks: {
        noop: { action: 'call' },
      },
      flow: [{ do: 'noop' }],
      outputs: { result: '=$output.noop' },
    };

    expect(() => WorkflowDefinitionSchema.parse(minimal)).not.toThrow();
  });

  it('rejects workflows with invalid JSONata expressions', () => {
    const invalid = {
      tasks: {
        noop: { action: 'call' },
      },
      flow: [{ do: 'noop' }],
      outputs: { result: '=$sum([1,2' }, // missing closing bracket makes JSONata invalid
    };

    expect(() => WorkflowDefinitionSchema.parse(invalid)).toThrow(
      /Invalid JSONata expression/,
    );
  });

  it('rejects task output mappings', () => {
    const invalid = {
      tasks: {
        noop: { action: 'call', outputs: { value: '=1' } },
      },
      flow: [{ do: 'noop' }],
      outputs: { result: '=$output.noop' },
    };

    expect(() => WorkflowDefinitionSchema.parse(invalid)).toThrow(
      /Unrecognized key/i,
    );
  });

  it('parses workflows with defs and task bindings', () => {
    const workflow = {
      defs: {
        calculate: {
          kind: 'tools',
          action: 'calculate_score',
          settings: { multiplier: 2 },
        },
      },
      tasks: {
        agent_step: {
          action: 'ai_agent',
          bindings: {
            tools: ['calculate'],
          },
        },
      },
      flow: [{ do: 'agent_step' }],
      outputs: { result: '=$output.agent_step' },
    };

    expect(() => WorkflowDefinitionSchema.parse(workflow)).not.toThrow();
  });

  it('rejects malformed task bindings definitions', () => {
    const invalid = {
      defs: {
        calculate: {
          kind: 'tools',
          action: 'calculate_score',
        },
      },
      tasks: {
        agent_step: {
          action: 'ai_agent',
          bindings: {
            tools: 42,
          },
        },
      },
      flow: [{ do: 'agent_step' }],
      outputs: { result: '=$output.agent_step' },
    };

    expect(() => WorkflowDefinitionSchema.parse(invalid)).toThrow();
  });
});
