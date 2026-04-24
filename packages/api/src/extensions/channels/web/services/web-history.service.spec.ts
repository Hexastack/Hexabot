/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  FileType,
  IncomingMessage,
  IncomingMessageType,
  OutgoingMessage,
  OutgoingMessageType,
} from '@hexabot-ai/types';

import { ChannelAttachmentService } from '@/channel/services/channel-attachment.service';
import { MessageService } from '@/chat/services/message.service';

import { WebInboundMessageEncoder } from '../inbound/web-inbound-message-encoder';
import { Web } from '../types';

import { WebFormatContext, WebHistoryService } from './web-history.service';

describe('WebHistoryService', () => {
  let service: WebHistoryService;
  let channelAttachmentService: jest.Mocked<
    Pick<ChannelAttachmentService, 'getPublicUrl'>
  >;
  let messageService: jest.Mocked<Pick<MessageService, 'findHistoryUntilDate'>>;
  let ctx: WebFormatContext;

  const buildIncomingMessage = (
    message: IncomingMessage['message'],
  ): IncomingMessage =>
    ({
      id: 'incoming-id',
      sender: 'subscriber-id',
      thread: 'thread-id',
      message,
      read: false,
      delivery: true,
      handover: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      mid: 'incoming-mid',
    }) as IncomingMessage;
  const buildOutgoingMessage = (
    message: OutgoingMessage['message'],
  ): OutgoingMessage =>
    ({
      id: 'outgoing-id',
      recipient: 'subscriber-id',
      thread: 'thread-id',
      message,
      read: false,
      delivery: true,
      handover: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      mid: 'outgoing-mid',
    }) as OutgoingMessage;

  beforeEach(() => {
    channelAttachmentService = {
      getPublicUrl: jest
        .fn()
        .mockResolvedValue('https://example.com/not-found'),
    };
    messageService = {
      findHistoryUntilDate: jest.fn(),
    };
    service = new WebHistoryService(
      messageService as unknown as MessageService,
    );
    ctx = {
      inboundEncoder: new WebInboundMessageEncoder(channelAttachmentService),
      outboundEncoder: {
        encode: jest.fn(),
      } as unknown as WebFormatContext['outboundEncoder'],
      generateId: jest.fn().mockReturnValue('generated-mid'),
      sourceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    };
  });

  it.each([
    {
      caseName: 'text',
      inputMessage: {
        type: IncomingMessageType.text,
        data: { text: 'Hello' },
      },
      expectedType: Web.InboundMessageType.text,
      expectedData: { text: 'Hello' },
    },
    {
      caseName: 'postback',
      inputMessage: {
        type: IncomingMessageType.postback,
        data: { text: 'Start', payload: 'GET_STARTED' },
      },
      expectedType: Web.InboundMessageType.postback,
      expectedData: { text: 'Start', payload: 'GET_STARTED' },
    },
    {
      caseName: 'quick reply',
      inputMessage: {
        type: IncomingMessageType.quickReply,
        data: { text: 'Pick one', payload: 'OPTION_1' },
      },
      expectedType: Web.InboundMessageType.quick_reply,
      expectedData: { text: 'Pick one', payload: 'OPTION_1' },
    },
  ])(
    'formats $caseName incoming history messages without attachment lookup',
    async ({ inputMessage, expectedType, expectedData }) => {
      const [formatted] = await service.formatMessages(
        [buildIncomingMessage(inputMessage as IncomingMessage['message'])],
        ctx,
      );

      expect(formatted).toMatchObject({
        type: expectedType,
        data: expectedData,
        author: 'subscriber-id',
        mid: 'incoming-mid',
        read: true,
      });
      expect(channelAttachmentService.getPublicUrl).not.toHaveBeenCalled();
    },
  );

  it('maps location coordinates from lon to lng', async () => {
    const [formatted] = await service.formatMessages(
      [
        buildIncomingMessage({
          type: IncomingMessageType.location,
          data: { coordinates: { lat: 10.5, lon: 11.5 } },
        }),
      ],
      ctx,
    );

    expect(formatted).toMatchObject({
      type: Web.InboundMessageType.location,
      data: {
        coordinates: {
          lat: 10.5,
          lng: 11.5,
        },
      },
    });
    expect(channelAttachmentService.getPublicUrl).not.toHaveBeenCalled();
  });

  it('keeps attachment history formatting resilient when persisted payload is empty', async () => {
    const [formatted] = await service.formatMessages(
      [
        buildIncomingMessage({
          type: IncomingMessageType.attachment,
          data: {
            serializedText: 'attachment:file:missing',
            attachment: [],
          },
        }),
      ],
      ctx,
    );

    expect(formatted).toMatchObject({
      type: Web.InboundMessageType.file,
      data: {
        type: FileType.unknown,
        url: 'https://example.com/not-found',
      },
    });
    expect(channelAttachmentService.getPublicUrl).toHaveBeenCalledWith(
      ctx.sourceId,
      undefined,
    );
  });

  it('passes list/carousel content options from persisted envelope to encoder', async () => {
    const contentOptions = {
      display: 'carousel' as const,
      fields: {
        title: 'title',
      },
      buttons: [],
      limit: 10,
    };
    const outgoing = buildOutgoingMessage({
      type: OutgoingMessageType.carousel,
      data: {
        options: contentOptions,
        elements: [{ id: 'content-1', title: 'Item 1' }],
        pagination: { total: 1, skip: 0, limit: 10 },
      },
    });
    (ctx.outboundEncoder.encode as jest.Mock).mockResolvedValue({
      type: Web.OutboundMessageType.carousel,
      data: { elements: [] },
    });

    await service.formatMessages([outgoing], ctx);

    expect(ctx.outboundEncoder.encode).toHaveBeenCalledWith(outgoing.message, {
      content: contentOptions,
      sourceId: ctx.sourceId,
    });
  });
});
