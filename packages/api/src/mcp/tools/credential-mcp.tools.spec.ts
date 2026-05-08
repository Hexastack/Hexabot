/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { sanitizeCredential } from './hexabot-mcp.utils';

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
});
