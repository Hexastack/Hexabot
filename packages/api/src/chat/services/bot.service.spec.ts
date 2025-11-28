/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { TestingModule } from '@nestjs/testing';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { BlockOrmEntity } from '@/chat/entities/block.entity';
import { CategoryOrmEntity } from '@/chat/entities/category.entity';
import { ContextVarOrmEntity } from '@/chat/entities/context-var.entity';
import { ConversationOrmEntity } from '@/chat/entities/conversation.entity';
import { LabelGroupOrmEntity } from '@/chat/entities/label-group.entity';
import { LabelOrmEntity } from '@/chat/entities/label.entity';
import { SubscriberOrmEntity } from '@/chat/entities/subscriber.entity';
import { ContentTypeOrmEntity } from '@/cms/entities/content-type.entity';
import { ContentOrmEntity } from '@/cms/entities/content.entity';
import { webEventText } from '@/extensions/channels/web/__test__/events.mock';
import WebChannelHandler from '@/extensions/channels/web/index.channel';
import { WEB_CHANNEL_NAME } from '@/extensions/channels/web/settings';
import WebEventWrapper from '@/extensions/channels/web/wrapper';
import { HelperService } from '@/helper/helper.service';
import { NlpEntityOrmEntity } from '@/nlp/entities/nlp-entity.entity';
import { NlpSampleEntityOrmEntity } from '@/nlp/entities/nlp-sample-entity.entity';
import { NlpSampleOrmEntity } from '@/nlp/entities/nlp-sample.entity';
import { NlpValueOrmEntity } from '@/nlp/entities/nlp-value.entity';
import { ModelOrmEntity } from '@/user/entities/model.entity';
import { PermissionOrmEntity } from '@/user/entities/permission.entity';
import { RoleOrmEntity } from '@/user/entities/role.entity';
import { UserProfileOrmEntity } from '@/user/entities/user-profile.entity';
import { UserOrmEntity } from '@/user/entities/user.entity';
import { installBlockFixturesTypeOrm } from '@/utils/test/fixtures/block';
import { installContentFixturesTypeOrm } from '@/utils/test/fixtures/content';
import { installContextVarFixturesTypeOrm } from '@/utils/test/fixtures/contextvar';
import { installConversationFixturesTypeOrm } from '@/utils/test/fixtures/conversation';
import { installNlpSampleEntityFixturesTypeOrm } from '@/utils/test/fixtures/nlpsampleentity';
import { installSettingFixturesTypeOrm } from '@/utils/test/fixtures/setting';
import { installSubscriberFixturesTypeOrm } from '@/utils/test/fixtures/subscriber';
import {
  buttonsBlock,
  mockWebChannelData,
  quickRepliesBlock,
  textBlock,
} from '@/utils/test/mocks/block';
import { conversationGetStarted } from '@/utils/test/mocks/conversation';
import { I18nServiceProvider } from '@/utils/test/providers/i18n-service.provider';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { BlockFull } from '../dto/block.dto';
import { Conversation, ConversationFull } from '../dto/conversation.dto';

import { BlockService } from './block.service';
import { BotService } from './bot.service';
import { ConversationService } from './conversation.service';
import { SubscriberService } from './subscriber.service';

describe('BotService', () => {
  let module: TestingModule;
  let blockService: BlockService;
  let subscriberService: SubscriberService;
  let conversationService: ConversationService;
  let botService: BotService;
  let handler: WebChannelHandler;
  let handlerMock: jest.Mocked<
    Pick<WebChannelHandler, 'getName' | 'sendMessage'>
  >;
  let eventEmitter: EventEmitter2;
  const helperServiceMock: jest.Mocked<
    Pick<HelperService, 'getDefaultHelper'>
  > = {
    getDefaultHelper: jest.fn(),
  };

  beforeAll(async () => {
    helperServiceMock.getDefaultHelper.mockImplementation(
      async () =>
        ({
          canHandleFlowEscape: () => false,
          addEntity: jest.fn(),
          updateEntity: jest.fn(),
          deleteEntity: jest.fn(),
        }) as any,
    );

    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [
        BotService,
        I18nServiceProvider,
        {
          provide: HelperService,
          useValue: helperServiceMock,
        },
      ],
      typeorm: {
        entities: [
          UserProfileOrmEntity,
          ConversationOrmEntity,
          ContextVarOrmEntity,
          BlockOrmEntity,
          CategoryOrmEntity,
          SubscriberOrmEntity,
          LabelOrmEntity,
          LabelGroupOrmEntity,
          UserOrmEntity,
          RoleOrmEntity,
          PermissionOrmEntity,
          ModelOrmEntity,
          AttachmentOrmEntity,
          NlpEntityOrmEntity,
          NlpValueOrmEntity,
          NlpSampleOrmEntity,
          NlpSampleEntityOrmEntity,
          ContentOrmEntity,
          ContentTypeOrmEntity,
        ],
        fixtures: [
          installSettingFixturesTypeOrm,
          installSubscriberFixturesTypeOrm,
          installBlockFixturesTypeOrm,
          installContextVarFixturesTypeOrm,
          installConversationFixturesTypeOrm,
          installContentFixturesTypeOrm,
          installNlpSampleEntityFixturesTypeOrm,
        ],
      },
    });

    module = testing.module;

    [
      subscriberService,
      conversationService,
      botService,
      blockService,
      eventEmitter,
    ] = await testing.getMocks([
      SubscriberService,
      ConversationService,
      BotService,
      BlockService,
      EventEmitter2,
    ]);

    handlerMock = {
      getName: jest.fn().mockReturnValue(WEB_CHANNEL_NAME),
      sendMessage: jest.fn().mockResolvedValue({ mid: 'mock-mid' }),
    };
    handler = handlerMock as unknown as WebChannelHandler;
  });

  afterEach(jest.resetAllMocks);
  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });
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
      const [block] = await blockService.findAndPopulate({
        where: { name: 'hasNextBlocks' },
      });
      const webSubscriber = (await subscriberService.findOne({
        where: { foreign_id: 'foreign-id-web-1' },
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
        where: { foreign_id: 'foreign-id-web-2' },
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
        where: { foreign_id: 'foreign-id-web-1' },
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

  describe('shouldAttemptLocalFallback', () => {
    const mockEvent = new WebEventWrapper(
      handler,
      webEventText,
      mockWebChannelData,
    );

    beforeAll(() => {
      jest.resetAllMocks();
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    it('should return true when fallback is active and max attempts not exceeded', () => {
      const result = botService.shouldAttemptLocalFallback(
        {
          ...conversationGetStarted,
          context: { ...conversationGetStarted.context, attempt: 1 },
          current: {
            ...conversationGetStarted.current,
            options: {
              fallback: {
                active: true,
                max_attempts: 1,
                message: ['Please pick an option.'],
              },
            },
          },
        },
        mockEvent,
      );
      expect(result).toBe(true);
    });

    it('should return true when fallback is active and max attempts not reached', () => {
      const result = botService.shouldAttemptLocalFallback(
        {
          ...conversationGetStarted,
          context: { ...conversationGetStarted.context, attempt: 1 },
          current: {
            ...conversationGetStarted.current,
            options: {
              fallback: {
                active: true,
                max_attempts: 3,
                message: ['Please pick an option.'],
              },
            },
          },
        },
        mockEvent,
      );
      expect(result).toBe(true);
    });

    it('should return false when fallback is not active', () => {
      const result = botService.shouldAttemptLocalFallback(
        {
          ...conversationGetStarted,
          context: { ...conversationGetStarted.context, attempt: 1 },
          current: {
            ...conversationGetStarted.current,
            options: {
              fallback: {
                active: false,
                max_attempts: 0,
                message: [],
              },
            },
          },
        },
        mockEvent,
      );
      expect(result).toBe(false);
    });

    it('should return false when max attempts reached', () => {
      const result = botService.shouldAttemptLocalFallback(
        {
          ...conversationGetStarted,
          context: { ...conversationGetStarted.context, attempt: 4 },
          current: {
            ...conversationGetStarted.current,
            options: {
              fallback: {
                active: true,
                max_attempts: 3,
                message: ['Please pick an option.'],
              },
            },
          },
        },
        mockEvent,
      );
      expect(result).toBe(false);
    });

    it('should return false when fallback options are missing', () => {
      const result = botService.shouldAttemptLocalFallback(
        {
          ...conversationGetStarted,
          current: {
            ...conversationGetStarted.current,
            options: {},
          },
        },
        mockEvent,
      );

      expect(result).toBe(false);
    });
  });

  describe('findNextMatchingBlock', () => {
    const mockEvent = new WebEventWrapper(
      handler,
      webEventText,
      mockWebChannelData,
    );

    beforeAll(() => {
      jest.resetAllMocks();
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    it('should return a matching block if one is found and fallback is not active', async () => {
      jest.spyOn(blockService, 'match').mockResolvedValue(buttonsBlock);

      const result = await botService.findNextMatchingBlock(
        {
          ...conversationGetStarted,
          current: {
            ...conversationGetStarted.current,
            options: {
              fallback: {
                active: false,
                message: [],
                max_attempts: 0,
              },
            },
          },
          next: [quickRepliesBlock, buttonsBlock].map((b) => ({
            ...b,
            trigger_labels: b.trigger_labels.map(({ id }) => id),
            assign_labels: b.assign_labels.map(({ id }) => id),
            nextBlocks: [],
            attachedBlock: null,
            category: null,
            previousBlocks: undefined,
            attachedToBlock: undefined,
          })),
        },
        mockEvent,
      );
      expect(result).toBe(buttonsBlock);
    });

    it('should return undefined if no matching block is found', async () => {
      jest.spyOn(blockService, 'match').mockResolvedValue(undefined);

      const result = await botService.findNextMatchingBlock(
        {
          ...conversationGetStarted,
          current: {
            ...conversationGetStarted.current,
            options: {
              fallback: {
                active: true,
                message: ['Please pick an option.'],
                max_attempts: 1,
              },
            },
          },
        },
        mockEvent,
      );
      expect(result).toBeUndefined();
    });
  });
});
