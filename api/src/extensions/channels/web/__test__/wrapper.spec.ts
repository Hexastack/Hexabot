/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import {
  Attachment,
  AttachmentModel,
} from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { ChannelService } from '@/channel/channel.service';
import { MessageRepository } from '@/chat/repositories/message.repository';
import { SubscriberRepository } from '@/chat/repositories/subscriber.repository';
import { MessageModel } from '@/chat/schemas/message.schema';
import { SubscriberModel } from '@/chat/schemas/subscriber.schema';
import {
  IncomingMessageType,
  StdEventType,
} from '@/chat/schemas/types/message';
import { MessageService } from '@/chat/services/message.service';
import { SubscriberService } from '@/chat/services/subscriber.service';
import { MenuRepository } from '@/cms/repositories/menu.repository';
import { MenuModel } from '@/cms/schemas/menu.schema';
import { MenuService } from '@/cms/services/menu.service';
import { I18nService } from '@/i18n/services/i18n.service';
import { NlpService } from '@/nlp/services/nlp.service';
import { SettingService } from '@/setting/services/setting.service';
import { installSubscriberFixtures } from '@/utils/test/fixtures/subscriber';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';
import { SocketEventDispatcherService } from '@/websocket/services/socket-event-dispatcher.service';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import WebChannelHandler from '../index.channel';
import { WEB_CHANNEL_NAME } from '../settings';
import WebEventWrapper from '../wrapper';

import { webEvents } from './events.mock';

describe(`Web event wrapper`, () => {
  let handler: WebChannelHandler;
  const webSettings = {};
  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      imports: [
        rootMongooseTestModule(installSubscriberFixtures),
        MongooseModule.forFeature([
          SubscriberModel,
          AttachmentModel,
          MessageModel,
          MenuModel,
        ]),
        JwtModule,
      ],
      providers: [
        {
          provide: SettingService,
          useValue: {
            getConfig: jest.fn(() => ({
              chatbot: { lang: { default: 'fr' } },
            })),
            getSettings: jest.fn(() => ({
              web: webSettings,
            })),
          },
        },
        {
          provide: NlpService,
          useValue: {
            getNLP: jest.fn(() => undefined),
          },
        },
        ChannelService,
        SubscriberService,
        SubscriberRepository,
        WebsocketGateway,
        SocketEventDispatcherService,
        AttachmentService,
        AttachmentRepository,
        MessageService,
        MessageRepository,
        MenuService,
        MenuRepository,
        WebChannelHandler,
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
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
