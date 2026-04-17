/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Request } from 'express';

import { AttachmentAccess } from '@/attachment/types';

import { ChannelService } from '../channel.service';

import { ChannelAttachmentService } from './channel-attachment.service';
import { ChannelDownloadService } from './channel-download.service';

describe('ChannelDownloadService', () => {
  let service: ChannelDownloadService;
  let channelService: jest.Mocked<Pick<ChannelService, 'getChannelHandler'>>;
  let channelAttachmentService: jest.Mocked<
    Pick<ChannelAttachmentService, 'download'>
  >;

  beforeEach(() => {
    channelService = {
      getChannelHandler: jest.fn(),
    };
    channelAttachmentService = {
      download: jest.fn(),
    };

    service = new ChannelDownloadService(
      channelService as unknown as ChannelService,
      channelAttachmentService as unknown as ChannelAttachmentService,
    );
  });

  it('delegates download to attachment service with handler policy callback', async () => {
    const req = {} as Request;
    const token = 'signed-token';
    const attachment = {
      id: 'attachment-id',
      access: AttachmentAccess.Private,
    };
    const handler = {
      hasDownloadAccess: jest.fn().mockResolvedValue(true),
    } as any;
    channelService.getChannelHandler.mockReturnValue(handler);
    channelAttachmentService.download.mockImplementation(
      async (_token, request, hasDownloadAccess) => {
        await hasDownloadAccess(attachment as any, request as Request);

        return 'stream' as any;
      },
    );

    const result = await service.download('web', token, req);

    expect(channelService.getChannelHandler).toHaveBeenCalledWith('web');
    expect(channelAttachmentService.download).toHaveBeenCalledWith(
      token,
      req,
      expect.any(Function),
    );
    expect(handler.hasDownloadAccess).toHaveBeenCalledWith(attachment, req);
    expect(result).toBe('stream');
  });
});
