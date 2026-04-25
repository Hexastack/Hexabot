/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { Request } from 'express';

import { ChannelService } from '../channel.service';

import { ChannelAttachmentService } from './channel-attachment.service';
import { SourceService } from './source.service';

@Injectable()
export class ChannelDownloadService {
  constructor(
    private readonly channelService: ChannelService,
    private readonly sourceService: SourceService,
    private readonly channelAttachmentService: ChannelAttachmentService,
  ) {}

  async download(sourceRef: string, token: string, req: Request) {
    const source = await this.sourceService.findActiveByRef(sourceRef);
    const handler = this.channelService.getChannelHandler(source.channel);

    return await this.channelAttachmentService.download(
      token,
      req,
      handler.hasDownloadAccess.bind(handler),
    );
  }
}
