/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { OutgoingMessageFormat } from '@hexabot-ai/types';

import {
  attachmentMessage,
  buttonsMessage,
  contentMessage,
  quickRepliesMessage,
  textMessage,
} from '@/channel/lib/__test__/common.mock';
import { UnsupportedOutgoingFormatError } from '@/channel/lib/outbound';

import {
  webAttachment,
  webButtons,
  webCarousel,
  webList,
  webQuickReplies,
  webText,
} from '../__test__/data.mock';
import { WEB_CHANNEL_NAME } from '../web-channel.settings';

import { WebOutboundMessageEncoder } from './web-outbound-message-encoder';

describe('WebOutboundMessageEncoder', () => {
  const channelName = WEB_CHANNEL_NAME;
  const channelAttachmentService = {
    getPublicUrl: jest
      .fn()
      .mockResolvedValue('http://public.url/download/filename.extension?t=any'),
  };
  const i18n = {
    t: jest.fn((key: string) => key),
  };
  const logger = {
    error: jest.fn(),
  };
  let encoder: WebOutboundMessageEncoder;
  const render = (envelope: any, options: any = {}) =>
    encoder.encode(envelope, options);

  beforeEach(() => {
    channelAttachmentService.getPublicUrl.mockClear();
    i18n.t.mockClear();
    logger.error.mockClear();
    encoder = new WebOutboundMessageEncoder(
      channelName,
      i18n as any,
      logger as any,
      channelAttachmentService as any,
    );
  });

  it('renders text envelopes', async () => {
    const formatted = await render({
      format: OutgoingMessageFormat.text,
      data: textMessage,
    });

    expect(formatted).toEqual(webText);
  });

  it('renders quick replies envelopes', async () => {
    const formatted = await render({
      format: OutgoingMessageFormat.quickReplies,
      data: quickRepliesMessage,
    });

    expect(formatted).toEqual(webQuickReplies);
  });

  it('renders buttons envelopes', async () => {
    const formatted = await render({
      format: OutgoingMessageFormat.buttons,
      data: buttonsMessage,
    });

    expect(formatted).toEqual(webButtons);
  });

  it('renders list envelopes', async () => {
    const formatted = await render(
      {
        format: OutgoingMessageFormat.list,
        data: contentMessage,
      },
      {
        content: contentMessage.options,
      },
    );

    expect(formatted).toEqual(webList);
  });

  it('renders carousel envelopes', async () => {
    const formatted = await render(
      {
        format: OutgoingMessageFormat.carousel,
        data: contentMessage,
      },
      {
        content: {
          ...contentMessage.options,
          display: OutgoingMessageFormat.carousel,
        },
      },
    );

    expect(formatted).toEqual(webCarousel);
  });

  it('renders attachment envelopes and resolves public urls', async () => {
    const formatted = await render({
      format: OutgoingMessageFormat.attachment,
      data: attachmentMessage,
    });

    expect(formatted).toEqual(webAttachment);
    expect(channelAttachmentService.getPublicUrl).toHaveBeenCalledWith(
      channelName,
      attachmentMessage.attachment.payload,
    );
  });

  it('throws when list content options are missing fields', async () => {
    await expect(
      encoder.encode(
        {
          format: OutgoingMessageFormat.list,
          data: contentMessage,
        },
        {},
      ),
    ).rejects.toThrow('Content options are missing the fields');
  });

  it('throws when list message has no elements', async () => {
    await expect(
      encoder.encode(
        {
          format: OutgoingMessageFormat.list,
          data: {
            ...contentMessage,
            elements: [],
          },
        },
        {
          content: contentMessage.options,
        },
      ),
    ).rejects.toThrow('Insufficient content count (list >= 0)');
    expect(logger.error).toHaveBeenCalledWith(
      'Insufficient content count (must be >= 0 for list)',
    );
  });

  it('throws when carousel message has no elements', async () => {
    await expect(
      encoder.encode(
        {
          format: OutgoingMessageFormat.carousel,
          data: {
            ...contentMessage,
            elements: [],
          },
        },
        {
          content: {
            ...contentMessage.options,
            display: OutgoingMessageFormat.carousel,
          },
        },
      ),
    ).rejects.toThrow('Insufficient content count (carousel > 0)');
    expect(logger.error).toHaveBeenCalledWith(
      'Insufficient content count (must be > 0 for carousel)',
    );
  });

  it('throws explicit error for unsupported outgoing formats', async () => {
    await expect(
      encoder.encode(
        {
          format: OutgoingMessageFormat.system,
          data: { outcome: 'noop' },
        } as any,
        {},
      ),
    ).rejects.toBeInstanceOf(UnsupportedOutgoingFormatError);
  });
});
