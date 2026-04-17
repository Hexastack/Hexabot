/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { Request } from 'express';

import { ChannelService } from '../channel.service';

import { ChannelAttachmentService } from './channel-attachment.service';

@Injectable()
export class ChannelDownloadService {
  constructor(
    private readonly channelService: ChannelService,
    private readonly channelAttachmentService: ChannelAttachmentService,
  ) {}

  async download(channel: string, token: string, req: Request) {
    const handler = this.channelService.getChannelHandler(channel);

    return await this.channelAttachmentService.download(
      token,
      req,
      handler.hasDownloadAccess.bind(handler),
    );
  }
}
