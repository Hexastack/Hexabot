/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { ChannelService } from '@/channel/channel.service';
import { ContentTypeRepository } from '@/cms/repositories/content-type.repository';
import { ContentRepository } from '@/cms/repositories/content.repository';
import { MenuRepository } from '@/cms/repositories/menu.repository';
import { ContentTypeModel } from '@/cms/schemas/content-type.schema';
import { ContentModel } from '@/cms/schemas/content.schema';
import { MenuModel } from '@/cms/schemas/menu.schema';
import { ContentTypeService } from '@/cms/services/content-type.service';
import { ContentService } from '@/cms/services/content.service';
import { MenuService } from '@/cms/services/menu.service';
import { webEventText } from '@/extensions/channels/web/__test__/events.mock';
import WebChannelHandler from '@/extensions/channels/web/index.channel';
import { WEB_CHANNEL_NAME } from '@/extensions/channels/web/settings';
import WebEventWrapper from '@/extensions/channels/web/wrapper';
import { HelperService } from '@/helper/helper.service';
import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { LanguageModel } from '@/i18n/schemas/language.schema';
import { I18nService } from '@/i18n/services/i18n.service';
import { LanguageService } from '@/i18n/services/language.service';
import { PluginService } from '@/plugins/plugins.service';
import { SettingService } from '@/setting/services/setting.service';
import { installBlockFixtures } from '@/utils/test/fixtures/block';
import { installContentFixtures } from '@/utils/test/fixtures/content';
import { installSubscriberFixtures } from '@/utils/test/fixtures/subscriber';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';
import { SocketEventDispatcherService } from '@/websocket/services/socket-event-dispatcher.service';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import { BlockRepository } from '../repositories/block.repository';
import { ContextVarRepository } from '../repositories/context-var.repository';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import { SubscriberRepository } from '../repositories/subscriber.repository';
import { BlockFull, BlockModel } from '../schemas/block.schema';
import { CategoryModel } from '../schemas/category.schema';
import { ContextVarModel } from '../schemas/context-var.schema';
import {
  Conversation,
  ConversationFull,
  ConversationModel,
} from '../schemas/conversation.schema';
import { LabelModel } from '../schemas/label.schema';
import { MessageModel } from '../schemas/message.schema';
import { SubscriberModel } from '../schemas/subscriber.schema';

import { CategoryRepository } from './../repositories/category.repository';
import { BlockService } from './block.service';
import { BotService } from './bot.service';
import { CategoryService } from './category.service';
import { ContextVarService } from './context-var.service';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import { SubscriberService } from './subscriber.service';

describe('BlockService', () => {
  let blockService: BlockService;
  let subscriberService: SubscriberService;
  let botService: BotService;
  let handler: WebChannelHandler;
  let eventEmitter: EventEmitter2;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      imports: [
        rootMongooseTestModule(async () => {
          await installSubscriberFixtures();
          await installContentFixtures();
          await installBlockFixtures();
        }),
        MongooseModule.forFeature([
          BlockModel,
          CategoryModel,
          ContentTypeModel,
          ContentModel,
          AttachmentModel,
          LabelModel,
          ConversationModel,
          SubscriberModel,
          MessageModel,
          MenuModel,
          ContextVarModel,
          LanguageModel,
        ]),
        JwtModule,
      ],
      providers: [
        BlockRepository,
        CategoryRepository,
        WebsocketGateway,
        SocketEventDispatcherService,
        ConversationRepository,
        ContentTypeRepository,
        ContentRepository,
        AttachmentRepository,
        SubscriberRepository,
        MessageRepository,
        MenuRepository,
        LanguageRepository,
        BlockService,
        CategoryService,
        ContentTypeService,
        ContentService,
        AttachmentService,
        SubscriberService,
        ConversationService,
        BotService,
        ChannelService,
        MessageService,
        MenuService,
        WebChannelHandler,
        ContextVarService,
        ContextVarRepository,
        LanguageService,
        {
          provide: HelperService,
          useValue: {},
        },
        {
          provide: PluginService,
          useValue: {},
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
        {
          provide: SettingService,
          useValue: {
            getConfig: jest.fn(() => ({
              chatbot: { lang: { default: 'fr' } },
            })),
            getSettings: jest.fn(() => ({
              contact: { company_name: 'Your company name' },
            })),
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
    [subscriberService, botService, blockService, eventEmitter, handler] =
      await getMocks([
        SubscriberService,
        BotService,
        BlockService,
        EventEmitter2,
        WebChannelHandler,
      ]);
  });

  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);

  it('should start a conversation', async () => {
    const triggeredEvents: any[] = [];

    eventEmitter.on('hook:stats:entry', (...args) => {
      triggeredEvents.push(args);
    });

    const event = new WebEventWrapper(handler, webEventText, {
      isSocket: false,
      ipAddress: '1.1.1.1',
      agent: 'Chromium',
    });

    const [block] = await blockService.findAndPopulate({ patterns: ['Hi'] });
    const webSubscriber = (await subscriberService.findOne({
      foreign_id: 'foreign-id-web-1',
    }))!;

    event.setSender(webSubscriber);

    let hasBotSpoken = false;
    const clearMock = jest
      .spyOn(botService, 'triggerBlock')
      .mockImplementation(
        (
          actualEvent: WebEventWrapper<typeof WEB_CHANNEL_NAME>,
          actualConversation: Conversation,
          actualBlock: BlockFull,
          isFallback: boolean,
        ) => {
          expect(actualConversation).toEqualPayload({
            sender: webSubscriber.id,
            active: true,
            next: [],
            context: {
              user: {
                first_name: webSubscriber.first_name,
                last_name: webSubscriber.last_name,
                language: 'en',
                id: webSubscriber.id,
              },
              user_location: {
                lat: 0,
                lon: 0,
              },
              skip: {},
              vars: {},
              nlp: null,
              payload: null,
              attempt: 0,
              channel: 'web-channel',
              text: webEventText.data.text,
            },
          });
          expect(actualEvent).toEqual(event);
          expect(actualBlock).toEqual(block);
          expect(isFallback).toEqual(false);
          hasBotSpoken = true;
        },
      );

    await botService.startConversation(event, block);
    expect(hasBotSpoken).toEqual(true);
    expect(triggeredEvents).toEqual([
      ['popular', 'hasNextBlocks', webSubscriber],
      ['new_conversations', 'New conversations', webSubscriber],
    ]);
    clearMock.mockClear();
  });

  it('should capture a conversation', async () => {
    const triggeredEvents: any[] = [];

    eventEmitter.on('hook:stats:entry', (...args) => {
      triggeredEvents.push(args);
    });

    const event = new WebEventWrapper(handler, webEventText, {
      isSocket: false,
      ipAddress: '1.1.1.1',
      agent: 'Chromium',
    });
    const webSubscriber = (await subscriberService.findOne({
      foreign_id: 'foreign-id-web-1',
    }))!;
    event.setSender(webSubscriber);

    const clearMock = jest
      .spyOn(botService, 'handleIncomingMessage')
      .mockImplementation(
        async (
          actualConversation: ConversationFull,
          event: WebEventWrapper<typeof WEB_CHANNEL_NAME>,
        ) => {
          expect(actualConversation).toEqualPayload({
            next: [],
            sender: webSubscriber,
            active: true,
            context: {
              user: {
                first_name: webSubscriber.first_name,
                last_name: webSubscriber.last_name,
                language: 'en',
                id: webSubscriber.id,
              },
              user_location: { lat: 0, lon: 0 },
              vars: {},
              skip: {},
              nlp: null,
              payload: null,
              attempt: 0,
              channel: 'web-channel',
              text: webEventText.data.text,
            },
          });
          expect(event).toEqual(event);
          return true;
        },
      );
    const captured = await botService.processConversationMessage(event);
    expect(captured).toBe(true);
    expect(triggeredEvents).toEqual([
      ['existing_conversations', 'Existing conversations', webSubscriber],
    ]);
    clearMock.mockClear();
  });

  it('has no active conversation', async () => {
    const triggeredEvents: any[] = [];
    eventEmitter.on('hook:stats:entry', (...args) => {
      triggeredEvents.push(args);
    });
    const event = new WebEventWrapper(handler, webEventText, {
      isSocket: false,
      ipAddress: '1.1.1.1',
      agent: 'Chromium',
    });
    const webSubscriber = (await subscriberService.findOne({
      foreign_id: 'foreign-id-web-2',
    }))!;
    event.setSender(webSubscriber);
    const captured = await botService.processConversationMessage(event);

    expect(captured).toBe(false);
    expect(triggeredEvents).toEqual([]);
  });
});
