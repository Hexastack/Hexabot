/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { buildWebSocketGatewayOptions } from './gateway-options';

describe('buildWebSocketGatewayOptions', () => {
  it('enables CORS credentials for socket transports', () => {
    const options = buildWebSocketGatewayOptions();

    expect(options.cors).toMatchObject({ credentials: true });
  });
});
