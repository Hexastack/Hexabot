/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { RuntimeBindingsService } from './runtime-bindings.service';

describe('RuntimeBindingsService', () => {
  const runtimeBindingsService = new RuntimeBindingsService();

  it('should expose JSON schema definitions for runtime bindings', () => {
    const definitions = runtimeBindingsService.getAllSchemaDefinitions();

    expect(definitions.tools).toBeDefined();
    expect(definitions.tools.$schema).toBe(
      'http://json-schema.org/draft-07/schema#',
    );
    const toolsDefinition = definitions.tools as
      | { properties?: Record<string, { type?: string }> }
      | undefined;

    expect(toolsDefinition?.properties?.action?.type).toBe('string');
  });
});
