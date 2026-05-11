/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { omitKeysDeep, sanitizeCredential } from './hexabot-mcp.utils';

describe('sanitizeCredential', () => {
  it('masks credential values from MCP output', () => {
    const credential = sanitizeCredential({
      id: 'credential-id',
      name: 'openai',
      value: 'secret-token',
      owner: 'user-id',
    });

    expect(credential).not.toHaveProperty('value');
    expect(JSON.stringify(credential)).not.toContain('secret-token');
  });

  it('omits selected keys recursively from MCP output', () => {
    const output = omitKeysDeep(
      {
        id: 'run-id',
        workflowVersion: {
          id: 'version-id',
          definitionYml: 'large-yaml',
        },
        children: [{ definitionYml: 'child-yaml', status: 'finished' }],
      },
      ['definitionYml'],
    );

    expect(output).toEqual({
      id: 'run-id',
      workflowVersion: {
        id: 'version-id',
      },
      children: [{ status: 'finished' }],
    });
  });
});
