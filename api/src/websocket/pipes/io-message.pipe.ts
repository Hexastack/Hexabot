/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

import { config } from '@/config';

import { Room } from '../types';

export interface IOOutgoingMessage {
  statusCode: number;
  body: any;
  headers: Record<string, string>;
}

export interface IOIncomingMessage {
  method: string;
  headers: Record<string, string>;
  data: Record<string, any>;
  params: Record<string, any>;
  url: string;
}

export interface IOOutgoingSubscribeMessage {
  success: boolean;
  subscribe: Room;
}

@Injectable()
export class IOMessagePipe implements PipeTransform<string, IOIncomingMessage> {
  transform(value: string, _metadata: ArgumentMetadata): IOIncomingMessage {
    let message: IOIncomingMessage;
    try {
      // TODO: Investigate why it arrives parsed
      message =
        typeof value === 'string'
          ? JSON.parse(value)
          : (value as any as IOIncomingMessage);
    } catch (error) {
      throw new BadRequestException('Invalid JSON format');
    }

    if (!message.method || !message.url) {
      throw new BadRequestException('Missing required fields: method, url');
    }

    const url = message.url.startsWith('http')
      ? message.url
      : `${config.apiBaseUrl}${message.url}`;

    if (!URL.canParse(url)) {
      throw new BadRequestException('Cannot parse url');
    }

    if (
      !['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(
        message.method,
      )
    ) {
      throw new BadRequestException('Invalid method!');
    }

    return message;
  }
}
