/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
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
