/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Attachment } from '@hexabot-ai/types';

import { FileType } from '@/chat/types/attachment';
import { IncomingMessageType, StdEventType } from '@/chat/types/message';

import {
  AttachmentMessageInboundEvent,
  createWebInboundEventDecoder,
  DeliveryNotificationInboundEvent,
  LocationMessageInboundEvent,
  PostbackInboundEvent,
  QuickReplyInboundEvent,
  ReadNotificationInboundEvent,
  TextMessageInboundEvent,
  TypingNotificationInboundEvent,
  WebMessageInboundEvent,
} from '../inbound';
import { Web } from '../types';
import { WEB_CHANNEL_NAME } from '../web-channel.settings';

const ATTACHMENT_ID = '99999999-9999-4999-9999-999999999999';
const channelData = {
  isSocket: false,
  ipAddress: '127.0.0.1',
  agent: 'browser',
};

describe('Web inbound events decoder', () => {
  const InboundEventDecoderProvider =
    createWebInboundEventDecoder(WEB_CHANNEL_NAME);
  const adapter = new InboundEventDecoderProvider();

  it.each([
    [
      'text',
      {
        type: Web.InboundMessageType.text,
        data: { text: 'Hello' },
        author: 'web-user',
        mid: 'msg-1',
      },
      TextMessageInboundEvent,
      StdEventType.message,
      IncomingMessageType.message,
    ],
    [
      'quick reply',
      {
        type: Web.InboundMessageType.quick_reply,
        data: { text: 'Choose', payload: 'CHOICE' },
        author: 'web-user',
        mid: 'msg-2',
      },
      QuickReplyInboundEvent,
      StdEventType.message,
      IncomingMessageType.quick_reply,
    ],
    [
      'postback',
      {
        type: Web.InboundMessageType.postback,
        data: { text: 'Go', payload: 'START' },
        author: 'web-user',
        mid: 'msg-3',
      },
      PostbackInboundEvent,
      StdEventType.message,
      IncomingMessageType.postback,
    ],
    [
      'location',
      {
        type: Web.InboundMessageType.location,
        data: { coordinates: { lat: 1.2, lng: 3.4 } },
        author: 'web-user',
        mid: 'msg-4',
      },
      LocationMessageInboundEvent,
      StdEventType.message,
      IncomingMessageType.location,
    ],
    [
      'attachment',
      {
        type: Web.InboundMessageType.file,
        data: {
          type: 'image/png',
          size: 10,
          name: 'photo.png',
          file: Buffer.from('photo'),
        },
        author: 'web-user',
        mid: 'msg-5',
      },
      AttachmentMessageInboundEvent,
      StdEventType.message,
      IncomingMessageType.attachments,
    ],
    [
      'delivery',
      {
        type: Web.StatusEventType.delivery,
        mid: 'msg-6',
      },
      DeliveryNotificationInboundEvent,
      StdEventType.delivery,
      null,
    ],
    [
      'read',
      {
        type: Web.StatusEventType.read,
        watermark: 12000,
      },
      ReadNotificationInboundEvent,
      StdEventType.read,
      null,
    ],
    [
      'typing',
      {
        type: Web.StatusEventType.typing,
      },
      TypingNotificationInboundEvent,
      StdEventType.typing,
      null,
    ],
  ])(
    'classifies %s event payload',
    (
      _caseName,
      payload,
      eventClass,
      expectedEventType,
      expectedMessageType,
    ) => {
      const events = adapter.createEvents(payload, channelData);

      expect(Array.isArray(events)).toBe(true);
      expect(events).toHaveLength(1);

      const [event] = events;

      expect(event).toBeInstanceOf(eventClass);
      expect(event.getEventType()).toBe(expectedEventType);

      if (event instanceof WebMessageInboundEvent) {
        expect(event.getMessageType()).toBe(expectedMessageType);
      }
    },
  );

  it('keeps message logic polymorphic and attachment state local', () => {
    const [textEvent] = adapter.createEvents(
      {
        type: Web.InboundMessageType.text,
        data: { text: 'Hello' },
        author: 'web-user',
        mid: 'msg-100',
      },
      channelData,
    );

    expect(textEvent).toBeInstanceOf(WebMessageInboundEvent);
    expect(textEvent).toBeInstanceOf(TextMessageInboundEvent);

    const [attachmentEvent] = adapter.createEvents(
      {
        type: Web.InboundMessageType.file,
        data: {
          type: 'image/png',
          size: 10,
          name: 'photo.png',
          file: Buffer.from('photo'),
        },
        author: 'web-user',
        mid: 'msg-101',
      },
      channelData,
    );

    expect(attachmentEvent).toBeInstanceOf(WebMessageInboundEvent);
    expect(attachmentEvent).toBeInstanceOf(AttachmentMessageInboundEvent);
    if (!(attachmentEvent instanceof AttachmentMessageInboundEvent)) {
      throw new Error('Expected attachment inbound event');
    }

    expect(() => attachmentEvent.getPayload()).toThrow(
      'Attachment has not been processed',
    );

    attachmentEvent.setUploadedAttachment({
      id: ATTACHMENT_ID,
      type: 'image/png',
      name: 'photo.png',
    } as Attachment);

    expect(attachmentEvent.getPayload()).toEqual({
      type: IncomingMessageType.attachments,
      attachment: {
        type: FileType.image,
        payload: {
          id: ATTACHMENT_ID,
        },
      },
    });
  });

  it('maps message payloads and normalized channel data', () => {
    const [event] = adapter.createEvents(
      {
        type: Web.InboundMessageType.postback,
        data: {
          text: 'Get Started',
          payload: 'GET_STARTED',
        },
        author: 'web-user',
        mid: 'msg-200',
      },
      channelData,
    );

    if (!(event instanceof PostbackInboundEvent)) {
      throw new Error('Expected postback inbound event');
    }

    expect(event.getChannelData()).toEqual({
      ...channelData,
      name: WEB_CHANNEL_NAME,
    });
    expect(event.getId()).toBe('msg-200');
    expect(event.getPayload()).toBe('GET_STARTED');
    expect(event.getMessage()).toEqual({
      postback: 'GET_STARTED',
      text: 'Get Started',
    });
    expect(event.buildInput()).toEqual(
      expect.objectContaining({
        message_type: IncomingMessageType.postback,
        mid: 'msg-200',
      }),
    );
  });

  it('keeps workflow id as transient event state', () => {
    const [event] = adapter.createEvents(
      {
        type: Web.InboundMessageType.text,
        data: { text: 'Workflow test' },
        author: 'web-user',
        mid: 'msg-300',
      },
      channelData,
    );

    if (!(event instanceof TextMessageInboundEvent)) {
      throw new Error('Expected text inbound event');
    }
    const workflowId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

    expect(event.getWorkflowId()).toBeUndefined();

    event.setWorkflowId(workflowId);

    expect(event.getWorkflowId()).toBe(workflowId);
    expect(event.buildInput()).not.toHaveProperty('workflowId');
    expect(event.getContextData()).not.toHaveProperty('workflowId');
  });

  it('exposes delivery and read behavior only on matching event classes', () => {
    const [deliveryEvent] = adapter.createEvents(
      {
        type: Web.StatusEventType.delivery,
        mid: 'mid-delivered',
      },
      channelData,
    );
    const [readEvent] = adapter.createEvents(
      {
        type: Web.StatusEventType.read,
        watermark: 24000,
      },
      channelData,
    );

    if (!(deliveryEvent instanceof DeliveryNotificationInboundEvent)) {
      throw new Error('Expected delivery inbound event');
    }
    if (!(readEvent instanceof ReadNotificationInboundEvent)) {
      throw new Error('Expected read inbound event');
    }

    expect(deliveryEvent.getDeliveredMessages()).toEqual(['mid-delivered']);
    expect(readEvent.getWatermark()).toBe(24);
  });

  it('throws when payload does not match incoming event schema', () => {
    expect(() =>
      adapter.createEvents(
        {
          type: Web.InboundMessageType.text,
          data: {},
        },
        channelData,
      ),
    ).toThrow();
  });
});
