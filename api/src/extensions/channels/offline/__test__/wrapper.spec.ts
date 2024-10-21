/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { ChannelService } from '@/channel/channel.service';
import { MessageRepository } from '@/chat/repositories/message.repository';
import { SubscriberRepository } from '@/chat/repositories/subscriber.repository';
import { MessageModel } from '@/chat/schemas/message.schema';
import { SubscriberModel } from '@/chat/schemas/subscriber.schema';
import { MessageService } from '@/chat/services/message.service';
import { SubscriberService } from '@/chat/services/subscriber.service';
import { MenuRepository } from '@/cms/repositories/menu.repository';
import { MenuModel } from '@/cms/schemas/menu.schema';
import { MenuService } from '@/cms/services/menu.service';
import { I18nService } from '@/i18n/services/i18n.service';
import { LoggerService } from '@/logger/logger.service';
import { NlpService } from '@/nlp/services/nlp.service';
import { SettingService } from '@/setting/services/setting.service';
import { installSubscriberFixtures } from '@/utils/test/fixtures/subscriber';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { SocketEventDispatcherService } from '@/websocket/services/socket-event-dispatcher.service';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import OfflineHandler from '../index.channel';
import OfflineEventWrapper from '../wrapper';

import { offlineEvents } from './events.mock';

describe(`Offline event wrapper`, () => {
  let handler: OfflineHandler;
  const offlineSettings = {};
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(async () => {
          await installSubscriberFixtures();
        }),
        MongooseModule.forFeature([
          SubscriberModel,
          AttachmentModel,
          MessageModel,
          MenuModel,
        ]),
      ],
      providers: [
        {
          provide: SettingService,
          useValue: {
            getConfig: jest.fn(() => ({
              chatbot: { lang: { default: 'fr' } },
            })),
            getSettings: jest.fn(() => ({
              offline: offlineSettings,
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
        OfflineHandler,
        EventEmitter2,
        LoggerService,
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
    }).compile();
    handler = module.get<OfflineHandler>(OfflineHandler);
  });

  afterAll(async () => {
    jest.clearAllMocks();
    await closeInMongodConnection();
  });

  test.each(offlineEvents)(
    'should wrap event : %s',
    (_testCase, e, expected) => {
      const event = new OfflineEventWrapper(
        handler as unknown as OfflineHandler,
        e,
        expected.channelData,
      );
      expect(event.getChannelData()).toEqual(expected.channelData);
      expect(event.getId()).toEqual(expected.id);
      expect(event.getEventType()).toEqual(expected.eventType);
      expect(event.getMessageType()).toEqual(expected.messageType);
      expect(event.getPayload()).toEqual(expected.payload);
      expect(event.getMessage()).toEqual(expected.message);
      expect(event.getDeliveredMessages()).toEqual([]);
    },
  );
});
