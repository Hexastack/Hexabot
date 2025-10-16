/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JwtService } from '@nestjs/jwt';

import { Attachment } from '@/attachment/entities/attachment.entity';
import {
  IncomingMessageType,
  StdEventType,
} from '@/chat/schemas/types/message';
import { I18nService } from '@/i18n/services/i18n.service';
import { installSubscriberFixtures } from '@/utils/test/fixtures/subscriber';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import WebChannelHandler from '../index.channel';
import { WEB_CHANNEL_NAME } from '../settings';
import WebEventWrapper from '../wrapper';

import { webEvents } from './events.mock';

describe(`Web event wrapper`, () => {
  let handler: WebChannelHandler;
  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installSubscriberFixtures)],
      providers: [
        JwtService,
        WebChannelHandler,
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
      ],
    });
    [handler] = await getMocks([WebChannelHandler]);
  });

  afterAll(async () => {
    jest.clearAllMocks();
    await closeInMongodConnection();
  });

  test.each(webEvents)('should wrap event : %s', (_testCase, e, expected) => {
    const event = new WebEventWrapper(
      handler as unknown as WebChannelHandler,
      e,
      expected.channelData,
    );

    if (
      event._adapter.eventType === StdEventType.message &&
      event._adapter.messageType === IncomingMessageType.attachments
    ) {
      event._adapter.attachment = {
        id: '9'.repeat(24),
        type: 'image/png',
        name: 'filename.extension',
      } as Attachment;
    }

    expect(event.getChannelData()).toEqual({
      ...expected.channelData,
      name: WEB_CHANNEL_NAME,
    });
    expect(event.getId()).toEqual(expected.id);
    expect(event.getEventType()).toEqual(expected.eventType);
    expect(event.getMessageType()).toEqual(expected.messageType);
    expect(event.getPayload()).toEqual(expected.payload);
    expect(event.getMessage()).toEqual(expected.message);
    expect(event.getDeliveredMessages()).toEqual([]);
  });
});
