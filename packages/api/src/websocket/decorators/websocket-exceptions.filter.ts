/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';

import { SocketResponse } from '../utils/socket-response';

@Catch()
export class WebSocketExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient<any>();
    const response = new SocketResponse(client);

    if (exception instanceof NotFoundException) {
      response.status(404).json({ error: 'Not Found' });
    } else {
      response.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
