/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowDefinitionSchema } from '../dsl.types';

describe('WorkflowDefinitionSchema', () => {
  it('parses a minimal valid workflow', () => {
    const minimal = {
      workflow: { name: 'demo', version: '1.0.0' },
      tasks: {
        noop: { action: 'call' },
      },
      flow: [{ do: 'noop' }],
      outputs: { result: '=$output.noop' },
    };

    expect(() => WorkflowDefinitionSchema.parse(minimal)).not.toThrow();
  });

  it('rejects workflows without outputs', () => {
    const invalid = {
      workflow: { name: 'demo', version: '1.0.0' },
      tasks: {
        noop: { action: 'call' },
      },
      flow: [{ do: 'noop' }],
      outputs: {},
    };

    expect(() => WorkflowDefinitionSchema.parse(invalid)).toThrow();
  });

  it('rejects workflows with invalid JSONata expressions', () => {
    const invalid = {
      workflow: { name: 'demo', version: '1.0.0' },
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
});
