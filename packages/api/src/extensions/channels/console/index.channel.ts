/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import BaseWebChannelHandler from '../web/base-web-channel';

import { CONSOLE_CHANNEL_NAME } from './console-channel.settings';

@Injectable()
export default class ConsoleChannelHandler extends BaseWebChannelHandler<
  typeof CONSOLE_CHANNEL_NAME
> {
  constructor() {
    super(CONSOLE_CHANNEL_NAME);
  }

  /**
   * Returns a unique identifier for the subscriber
   *
   * @returns UUID
   */
  generateId(): string {
    return 'console-' + uuidv4();
  }
}
