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
import { NlpEntityRepository } from '@/nlp/repositories/nlp-entity.repository';
import { NlpSampleEntityRepository } from '@/nlp/repositories/nlp-sample-entity.repository';
import { NlpSampleRepository } from '@/nlp/repositories/nlp-sample.repository';
import { NlpValueRepository } from '@/nlp/repositories/nlp-value.repository';
import { NlpEntityModel } from '@/nlp/schemas/nlp-entity.schema';
import { NlpSampleEntityModel } from '@/nlp/schemas/nlp-sample-entity.schema';
import { NlpSampleModel } from '@/nlp/schemas/nlp-sample.schema';
import { NlpValueModel } from '@/nlp/schemas/nlp-value.schema';
import { NlpEntityService } from '@/nlp/services/nlp-entity.service';
import { NlpSampleEntityService } from '@/nlp/services/nlp-sample-entity.service';
import { NlpSampleService } from '@/nlp/services/nlp-sample.service';
import { NlpValueService } from '@/nlp/services/nlp-value.service';
import { NlpService } from '@/nlp/services/nlp.service';
import { PluginService } from '@/plugins/plugins.service';
import { SettingService } from '@/setting/services/setting.service';
import { installBlockFixtures } from '@/utils/test/fixtures/block';
import { installContentFixtures } from '@/utils/test/fixtures/content';
import { installSubscriberFixtures } from '@/utils/test/fixtures/subscriber';
import { mockWebChannelData, textBlock } from '@/utils/test/mocks/block';
import { conversationGetStarted } from '@/utils/test/mocks/conversation';
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

describe('BotService', () => {
  let blockService: BlockService;
  let subscriberService: SubscriberService;
  let conversationService: ConversationService;
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
          NlpEntityModel,
          NlpSampleEntityModel,
          NlpValueModel,
          NlpSampleModel,
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
        ContextVarRepository,
        NlpEntityRepository,
        NlpSampleEntityRepository,
        NlpValueRepository,
        NlpSampleRepository,
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
        LanguageService,
        NlpEntityService,
        NlpValueService,
        NlpSampleService,
        NlpSampleEntityService,
        NlpService,
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
    [
      subscriberService,
      conversationService,
      botService,
      blockService,
      eventEmitter,
      handler,
    ] = await getMocks([
      SubscriberService,
      ConversationService,
      BotService,
      BlockService,
      EventEmitter2,
      WebChannelHandler,
    ]);
  });

  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);
  describe('startConversation', () => {
    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should start a conversation', async () => {
      const triggeredEvents: any[] = [];

      eventEmitter.on('hook:stats:entry', (...args) => {
        triggeredEvents.push(args);
      });

      const event = new WebEventWrapper(
        handler,
        webEventText,
        mockWebChannelData,
      );

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
        ['popular', 'hasNextBlocks'],
        ['new_conversations', 'New conversations'],
      ]);
      clearMock.mockClear();
    });
  });

  describe('processConversationMessage', () => {
    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('has no active conversation', async () => {
      const triggeredEvents: any[] = [];
      eventEmitter.on('hook:stats:entry', (...args) => {
        triggeredEvents.push(args);
      });
      const event = new WebEventWrapper(
        handler,
        webEventText,
        mockWebChannelData,
      );
      const webSubscriber = (await subscriberService.findOne({
        foreign_id: 'foreign-id-web-2',
      }))!;
      event.setSender(webSubscriber);
      const captured = await botService.processConversationMessage(event);

      expect(captured).toBe(false);
      expect(triggeredEvents).toEqual([]);
    });

    it('should capture a conversation', async () => {
      const triggeredEvents: any[] = [];

      eventEmitter.on('hook:stats:entry', (...args) => {
        triggeredEvents.push(args);
      });

      const event = new WebEventWrapper(
        handler,
        webEventText,
        mockWebChannelData,
      );
      const webSubscriber = (await subscriberService.findOne({
        foreign_id: 'foreign-id-web-1',
      }))!;
      event.setSender(webSubscriber);

      jest
        .spyOn(botService, 'handleOngoingConversationMessage')
        .mockImplementation(() => Promise.resolve(true));
      const captured = await botService.processConversationMessage(event);
      expect(captured).toBe(true);
      expect(triggeredEvents).toEqual([
        ['existing_conversations', 'Existing conversations'],
      ]);
    });
  });

  describe('proceedToNextBlock', () => {
    const mockEvent = new WebEventWrapper(
      handler,
      webEventText,
      mockWebChannelData,
    );

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should emit stats and call triggerBlock, returning true on success and reset attempt if not fallback', async () => {
      const mockConvo = {
        ...conversationGetStarted,
        id: 'convo1',
        context: { attempt: 2 },
        next: [],
        sender: 'user1',
        active: true,
      } as unknown as ConversationFull;
      const next = { id: 'block1', name: 'Block 1' } as BlockFull;
      const fallback = false;

      jest
        .spyOn(conversationService, 'storeContextData')
        .mockImplementation(() => {
          return Promise.resolve(mockConvo as unknown as Conversation);
        });

      jest.spyOn(botService, 'triggerBlock').mockResolvedValue(undefined);
      const emitSpy = jest.spyOn(eventEmitter, 'emit');
      const result = await botService.proceedToNextBlock(
        mockConvo,
        next,
        mockEvent,
        fallback,
      );

      expect(emitSpy).toHaveBeenCalledWith(
        'hook:stats:entry',
        'popular',
        next.name,
      );

      expect(botService.triggerBlock).toHaveBeenCalledWith(
        mockEvent,
        expect.objectContaining({ id: 'convo1' }),
        next,
        fallback,
      );
      expect(result).toBe(true);
      expect(mockConvo.context.attempt).toBe(0);
    });

    it('should increment attempt if fallback is true', async () => {
      const mockConvo = {
        ...conversationGetStarted,
        id: 'convo2',
        context: { attempt: 1 },
        next: [],
        sender: 'user2',
        active: true,
      } as unknown as ConversationFull;
      const next = { id: 'block2', name: 'Block 2' } as any;
      const fallback = true;

      const result = await botService.proceedToNextBlock(
        mockConvo,
        next,
        mockEvent,
        fallback,
      );

      expect(mockConvo.context.attempt).toBe(2);
      expect(result).toBe(true);
    });

    it('should handle errors and emit conversation:end, returning false', async () => {
      const mockConvo = {
        ...conversationGetStarted,
        id: 'convo3',
        context: { attempt: 1 },
        next: [],
        sender: 'user3',
        active: true,
      } as unknown as ConversationFull;
      const next = { id: 'block3', name: 'Block 3' } as any;
      const fallback = false;

      jest
        .spyOn(conversationService, 'storeContextData')
        .mockRejectedValue(new Error('fail'));

      const emitSpy = jest.spyOn(eventEmitter, 'emit');
      const result = await botService.proceedToNextBlock(
        mockConvo,
        next,
        mockEvent,
        fallback,
      );

      expect(emitSpy).toHaveBeenCalledWith('hook:conversation:end', mockConvo);
      expect(result).toBe(false);
    });
  });

  describe('handleOngoingConversationMessage', () => {
    const mockConvo = {
      ...conversationGetStarted,
      id: 'convo1',
      context: { ...conversationGetStarted.context, attempt: 0 },
      next: [{ id: 'block1' }],
      current: {
        ...conversationGetStarted.current,
        id: 'block0',
        options: {
          ...conversationGetStarted.current.options,
          fallback: {
            active: true,
            max_attempts: 2,
            message: [],
          },
        },
      },
    } as unknown as ConversationFull;

    const mockEvent = new WebEventWrapper(
      handler,
      webEventText,
      mockWebChannelData,
    );

    beforeAll(() => {
      jest.clearAllMocks();
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it('should proceed to the matched next block', async () => {
      const matchedBlock = {
        ...textBlock,
        id: 'block1',
        name: 'Block 1',
      } as BlockFull;
      jest
        .spyOn(blockService, 'findAndPopulate')
        .mockResolvedValue([matchedBlock]);
      jest.spyOn(blockService, 'match').mockResolvedValue(matchedBlock);
      jest.spyOn(botService, 'proceedToNextBlock').mockResolvedValue(true);

      const result = await botService.handleOngoingConversationMessage(
        mockConvo,
        mockEvent,
      );

      expect(blockService.findAndPopulate).toHaveBeenCalled();
      expect(blockService.match).toHaveBeenCalled();
      expect(botService.proceedToNextBlock).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should proceed to fallback block if no match and fallback is allowed', async () => {
      jest.spyOn(blockService, 'findAndPopulate').mockResolvedValue([]);
      jest.spyOn(blockService, 'match').mockResolvedValue(undefined);
      const proceedSpy = jest
        .spyOn(botService, 'proceedToNextBlock')
        .mockResolvedValue(true);

      const result = await botService.handleOngoingConversationMessage(
        mockConvo,
        mockEvent,
      );

      expect(proceedSpy).toHaveBeenCalledWith(
        mockConvo,
        expect.objectContaining({ id: 'block0', nextBlocks: mockConvo.next }),
        mockEvent,
        true,
      );
      expect(result).toBe(true);
    });

    it('should end conversation and return false if no match and fallback not allowed', async () => {
      const mockConvoWithoutFallback = {
        ...mockConvo,
        current: {
          ...mockConvo.current,
          options: {
            ...mockConvo.current.options,
            fallback: {
              active: false,
              max_attempts: 2,
              message: [],
            },
          },
        },
      } as unknown as ConversationFull;
      jest.spyOn(blockService, 'findAndPopulate').mockResolvedValue([]);
      jest.spyOn(blockService, 'match').mockResolvedValue(undefined);
      const emitSpy = jest.spyOn(eventEmitter, 'emit');

      const result = await botService.handleOngoingConversationMessage(
        mockConvoWithoutFallback,
        mockEvent,
      );

      expect(emitSpy).toHaveBeenCalledWith(
        'hook:conversation:end',
        mockConvoWithoutFallback,
      );
      expect(result).toBe(false);
    });

    it('should end conversation and throw if an error occurs', async () => {
      jest
        .spyOn(blockService, 'findAndPopulate')
        .mockRejectedValue(new Error('fail'));
      const emitSpy = jest.spyOn(eventEmitter, 'emit');

      await expect(
        botService.handleOngoingConversationMessage(mockConvo, mockEvent),
      ).rejects.toThrow('fail');
      expect(emitSpy).toHaveBeenCalledWith('hook:conversation:end', mockConvo);
    });
  });
});
