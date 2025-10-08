/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const SocketRes = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const client = ctx.switchToWs().getClient<any>();
    return client.response; // Assuming `response` is attached to the client object
  },
);
