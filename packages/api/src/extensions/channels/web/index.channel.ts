/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import BaseWebChannelHandler from './base-web-channel';
import {
  WEB_CHANNEL_NAME,
  WEB_CHANNEL_SOURCE_SETTINGS_SCHEMA,
} from './settings.schema';

@Injectable()
export default class WebChannelHandler extends BaseWebChannelHandler<
  typeof WEB_CHANNEL_NAME
> {
  constructor() {
    super(WEB_CHANNEL_NAME, WEB_CHANNEL_SOURCE_SETTINGS_SCHEMA);
  }
}
