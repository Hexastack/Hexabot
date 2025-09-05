/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  subscriberWithLabels,
  subscriberWithoutLabels,
} from '@/channel/lib/__test__/subscriber.mock';
import { ButtonType, PayloadType } from '@/chat/schemas/types/button';
import { Content } from '@/cms/schemas/content.schema';
import { ContentTypeService } from '@/cms/services/content-type.service';
import { ContentService } from '@/cms/services/content.service';
import WebChannelHandler from '@/extensions/channels/web/index.channel';
import { WEB_CHANNEL_NAME } from '@/extensions/channels/web/settings';
import { Web } from '@/extensions/channels/web/types';
import WebEventWrapper from '@/extensions/channels/web/wrapper';
import { I18nService } from '@/i18n/services/i18n.service';
import { FALLBACK_DEFAULT_NLU_PENALTY_FACTOR } from '@/utils/constants/nlp';
import {
  blockFixtures,
  installBlockFixtures,
} from '@/utils/test/fixtures/block';
import { installContentFixtures } from '@/utils/test/fixtures/content';
import { installNlpValueFixtures } from '@/utils/test/fixtures/nlpvalue';
import {
  blockEmpty,
  blockGetStarted,
  blockProductListMock,
  blocks,
  mockNlpAffirmationPatterns,
  mockNlpFirstNamePatterns,
  mockNlpGreetingAnyNamePatterns,
  mockNlpGreetingNamePatterns,
  mockNlpGreetingPatterns,
  mockNlpGreetingWrongNamePatterns,
  mockWebChannelData,
} from '@/utils/test/mocks/block';
import {
  contextBlankInstance,
  subscriberContextBlankInstance,
} from '@/utils/test/mocks/conversation';
import {
  mockNlpFirstNameEntities,
  mockNlpGreetingFullNameEntities,
  mockNlpGreetingNameEntities,
} from '@/utils/test/mocks/nlp';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { BlockRepository } from '../repositories/block.repository';
import { Block, BlockFull } from '../schemas/block.schema';
import { Category } from '../schemas/category.schema';
import { Subscriber } from '../schemas/subscriber.schema';
import { FileType } from '../schemas/types/attachment';
import { Context } from '../schemas/types/context';
import {
  OutgoingMessageFormat,
  StdOutgoingListMessage,
} from '../schemas/types/message';
import { QuickReplyType } from '../schemas/types/quick-reply';

import { CategoryRepository } from './../repositories/category.repository';
import { BlockService } from './block.service';

function makeMockBlock(overrides: Partial<Block>): Block {
  return {
    id: 'default',
    message: [],
    trigger_labels: [],
    assign_labels: [],
    nextBlocks: [],
    attachedBlock: null,
    category: null,
    name: '',
    patterns: [],
    outcomes: [],
    trigger_channels: [],
    options: {},
    starts_conversation: false,
    capture_vars: [],
    position: { x: 0, y: 0 },
    builtin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('BlockService', () => {
  let blockRepository: BlockRepository;
  let categoryRepository: CategoryRepository;
  let category: Category;
  let block: Block;
  let blockService: BlockService;
  let hasPreviousBlocks: Block;
  let contentService: ContentService;
  let contentTypeService: ContentTypeService;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      models: ['LabelModel'],
      autoInjectFrom: ['providers'],
      imports: [
        rootMongooseTestModule(async () => {
          await installContentFixtures();
          await installBlockFixtures();
          await installNlpValueFixtures();
        }),
      ],
      providers: [
        BlockService,
        ContentTypeService,
        CategoryRepository,
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => {
              return t === 'Welcome' ? 'Bienvenue' : t;
            }),
          },
        },
      ],
    });
    [
      blockService,
      contentService,
      contentTypeService,
      categoryRepository,
      blockRepository,
    ] = await getMocks([
      BlockService,
      ContentService,
      ContentTypeService,
      CategoryRepository,
      BlockRepository,
    ]);
    category = (await categoryRepository.findOne({ label: 'default' }))!;
    hasPreviousBlocks = (await blockRepository.findOne({
      name: 'hasPreviousBlocks',
    }))!;
    block = (await blockRepository.findOne({ name: 'hasNextBlocks' }))!;
  });

  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);

  describe('findOneAndPopulate', () => {
    it('should find one block by id, and populate its trigger_labels, assign_labels,attachedBlock,category,nextBlocks', async () => {
      jest.spyOn(blockRepository, 'findOneAndPopulate');
      const result = await blockService.findOneAndPopulate(block.id);

      expect(blockRepository.findOneAndPopulate).toHaveBeenCalledWith(
        block.id,
        undefined,
      );
      expect(result).toEqualPayload({
        ...blockFixtures.find(({ name }) => name === 'hasNextBlocks'),
        category,
        nextBlocks: [hasPreviousBlocks],
        previousBlocks: [],
        attachedToBlock: null,
      });
    });
  });

  describe('findAndPopulate', () => {
    it('should find blocks and populate them', async () => {
      jest.spyOn(blockRepository, 'findAndPopulate');
      const result = await blockService.findAndPopulate({});
      const blocksWithCategory = blockFixtures.map((blockFixture) => ({
        ...blockFixture,
        category,
        previousBlocks:
          blockFixture.name === 'hasPreviousBlocks' ? [block] : [],
        nextBlocks:
          blockFixture.name === 'hasNextBlocks' ? [hasPreviousBlocks] : [],
        attachedToBlock: null,
      }));

      expect(blockRepository.findAndPopulate).toHaveBeenCalledWith(
        {},
        undefined,
        undefined,
      );
      expect(result).toEqualPayload(blocksWithCategory);
    });
  });

  describe('match', () => {
    const handlerMock = {
      getName: jest.fn(() => WEB_CHANNEL_NAME),
    } as any as WebChannelHandler;
    const webEventGreeting = new WebEventWrapper(
      handlerMock,
      {
        type: Web.IncomingMessageType.text,
        data: {
          text: 'Hello',
        },
      },
      mockWebChannelData,
    );
    const webEventGetStarted = new WebEventWrapper(
      handlerMock,
      {
        type: Web.IncomingMessageType.postback,
        data: {
          text: 'Get Started',
          payload: 'GET_STARTED',
        },
      },
      mockWebChannelData,
    );

    const webEventAmbiguous = new WebEventWrapper(
      handlerMock,
      {
        type: Web.IncomingMessageType.text,
        data: {
          text: "It's not a yes or no answer!",
        },
      },
      mockWebChannelData,
    );

    it('should return undefined when no blocks are provided', async () => {
      const result = await blockService.match([], webEventGreeting);
      expect(result).toBe(undefined);
    });

    it('should return undefined for empty blocks', async () => {
      const result = await blockService.match([blockEmpty], webEventGreeting);
      expect(result).toEqual(undefined);
    });

    it('should return undefined for no matching labels', async () => {
      webEventGreeting.setSender(subscriberWithoutLabels);
      const result = await blockService.match(blocks, webEventGreeting);
      expect(result).toEqual(undefined);
    });

    it('should match block text and labels', async () => {
      webEventGreeting.setSender(subscriberWithLabels);
      const result = await blockService.match(blocks, webEventGreeting);
      expect(result).toEqual(blockGetStarted);
    });

    it('should return undefined when multiple matches are not allowed', async () => {
      const result = await blockService.match(
        [
          {
            ...blockEmpty,
            patterns: ['/yes/'],
          },
          {
            ...blockEmpty,
            patterns: ['/no/'],
          },
        ],
        webEventAmbiguous,
        false,
      );
      expect(result).toEqual(undefined);
    });

    it('should match block with payload', async () => {
      webEventGetStarted.setSender(subscriberWithLabels);
      const result = await blockService.match(blocks, webEventGetStarted);
      expect(result).toEqual(blockGetStarted);
    });

    it('should match block with nlp', async () => {
      webEventGreeting.setSender(subscriberWithLabels);
      webEventGreeting.setNLP(mockNlpGreetingFullNameEntities);
      const result = await blockService.match(blocks, webEventGreeting);
      expect(result).toEqual(blockGetStarted);
    });
  });

  describe('matchNLP', () => {
    it('should return an empty array for a block with no NLP patterns', () => {
      const result = blockService.getMatchingNluPatterns(
        mockNlpGreetingFullNameEntities,
        blockEmpty,
      );
      expect(result).toEqual([]);
    });

    it('should return an empty array when no NLP entities are provided', () => {
      const result = blockService.getMatchingNluPatterns(
        { entities: [] },
        blockGetStarted,
      );
      expect(result).toEqual([]);
    });

    it('should return match nlp patterns', () => {
      const result = blockService.getMatchingNluPatterns(
        mockNlpGreetingFullNameEntities,
        {
          ...blockGetStarted,
          patterns: [...blockGetStarted.patterns, mockNlpGreetingNamePatterns],
        },
      );
      expect(result).toEqual([
        [
          {
            entity: 'intent',
            match: 'value',
            value: 'greeting',
          },
          {
            entity: 'firstname',
            match: 'value',
            value: 'jhon',
          },
        ],
      ]);
    });

    it('should return match nlp patterns with synonyms match (canonical value)', () => {
      const result = blockService.getMatchingNluPatterns(
        mockNlpFirstNameEntities,
        {
          ...blockGetStarted,
          patterns: [...blockGetStarted.patterns, mockNlpFirstNamePatterns],
        },
      );
      expect(result).toEqual([
        [
          {
            entity: 'firstname',
            match: 'value',
            value: 'jhon',
          },
        ],
      ]);
    });

    it('should return empty array when it does not match nlp patterns', () => {
      const result = blockService.getMatchingNluPatterns(
        mockNlpGreetingFullNameEntities,
        {
          ...blockGetStarted,
          patterns: [
            [{ entity: 'lastname', match: 'value', value: 'Belakhel' }],
          ],
        },
      );
      expect(result).toEqual([]);
    });

    it('should return empty array when unknown nlp patterns', () => {
      const result = blockService.getMatchingNluPatterns(
        mockNlpGreetingFullNameEntities,
        {
          ...blockGetStarted,
          patterns: [[{ entity: 'product', match: 'value', value: 'pizza' }]],
        },
      );
      expect(result).toEqual([]);
    });
  });

  describe('matchBestNLP', () => {
    it('should return the block with the highest NLP score', async () => {
      const mockExpectedBlock: BlockFull = {
        ...blockGetStarted,
        patterns: [...blockGetStarted.patterns, mockNlpGreetingNamePatterns],
      };
      const blocks: BlockFull[] = [
        // no match
        blockGetStarted,
        // match
        mockExpectedBlock,
        // match
        {
          ...blockGetStarted,
          patterns: [...blockGetStarted.patterns, mockNlpGreetingPatterns],
        },
        // no match
        {
          ...blockGetStarted,
          patterns: [
            ...blockGetStarted.patterns,
            mockNlpGreetingWrongNamePatterns,
          ],
        },
        // no match
        {
          ...blockGetStarted,
          patterns: [...blockGetStarted.patterns, mockNlpAffirmationPatterns],
        },
        // no match
        blockGetStarted,
      ];

      // Spy on calculateBlockScore to check if it's called
      const calculateBlockScoreSpy = jest.spyOn(
        blockService,
        'calculateNluPatternMatchScore',
      );

      const bestBlock = blockService.matchBestNLP(
        blocks,
        mockNlpGreetingNameEntities,
        FALLBACK_DEFAULT_NLU_PENALTY_FACTOR,
      );

      // Ensure calculateBlockScore was called at least once for each block
      expect(calculateBlockScoreSpy).toHaveBeenCalledTimes(2); // Called for each block

      // Assert that the block with the highest NLP score is selected
      expect(bestBlock).toEqual(mockExpectedBlock);
    });

    it('should return the block with the highest NLP score applying penalties', async () => {
      const mockExpectedBlock: BlockFull = {
        ...blockGetStarted,
        patterns: [...blockGetStarted.patterns, mockNlpGreetingNamePatterns],
      };
      const blocks: BlockFull[] = [
        // no match
        blockGetStarted,
        // match
        mockExpectedBlock,
        // match
        {
          ...blockGetStarted,
          patterns: [...blockGetStarted.patterns, mockNlpGreetingPatterns],
        },
        // match
        {
          ...blockGetStarted,
          patterns: [
            ...blockGetStarted.patterns,
            mockNlpGreetingAnyNamePatterns,
          ],
        },
      ];
      const nlp = mockNlpGreetingNameEntities;
      // Spy on calculateBlockScore to check if it's called
      const calculateBlockScoreSpy = jest.spyOn(
        blockService,
        'calculateNluPatternMatchScore',
      );
      const bestBlock = blockService.matchBestNLP(
        blocks,
        nlp,
        FALLBACK_DEFAULT_NLU_PENALTY_FACTOR,
      );

      // Ensure calculateBlockScore was called at least once for each block
      expect(calculateBlockScoreSpy).toHaveBeenCalledTimes(3); // Called for each block

      // Assert that the block with the highest NLP score is selected
      expect(bestBlock).toEqual(mockExpectedBlock);
    });

    it('should return undefined if no blocks match or the list is empty', async () => {
      const blocks: BlockFull[] = [
        {
          ...blockGetStarted,
          patterns: [...blockGetStarted.patterns, mockNlpAffirmationPatterns],
        },
        blockGetStarted,
      ];

      const bestBlock = blockService.matchBestNLP(
        blocks,
        mockNlpGreetingNameEntities,
        FALLBACK_DEFAULT_NLU_PENALTY_FACTOR,
      );

      // Assert that undefined is returned when no blocks are available
      expect(bestBlock).toBeUndefined();
    });
  });

  describe('calculateNluPatternMatchScore', () => {
    it('should calculate the correct NLP score for a block', async () => {
      const matchingScore = blockService.calculateNluPatternMatchScore(
        mockNlpGreetingNamePatterns,
        mockNlpGreetingNameEntities,
        FALLBACK_DEFAULT_NLU_PENALTY_FACTOR,
      );

      expect(matchingScore).toBeGreaterThan(0);
    });

    it('should calculate the correct NLP score for a block and apply penalties ', async () => {
      const scoreWithoutPenalty = blockService.calculateNluPatternMatchScore(
        mockNlpGreetingNamePatterns,
        mockNlpGreetingNameEntities,
        FALLBACK_DEFAULT_NLU_PENALTY_FACTOR,
      );

      const scoreWithPenalty = blockService.calculateNluPatternMatchScore(
        mockNlpGreetingAnyNamePatterns,
        mockNlpGreetingNameEntities,
        FALLBACK_DEFAULT_NLU_PENALTY_FACTOR,
      );

      expect(scoreWithoutPenalty).toBeGreaterThan(scoreWithPenalty);
    });

    it('should handle invalid case for penalty factor values', async () => {
      // Test with invalid penalty (should use fallback)
      const scoreWithInvalidPenalty =
        blockService.calculateNluPatternMatchScore(
          mockNlpGreetingAnyNamePatterns,
          mockNlpGreetingNameEntities,
          -1,
        );

      expect(scoreWithInvalidPenalty).toBeGreaterThan(0); // Should use fallback value
    });
  });

  describe('matchPayload', () => {
    it('should return undefined for empty payload', () => {
      const result = blockService.matchPayload('', blockGetStarted);
      expect(result).toEqual(undefined);
    });

    it('should return undefined for empty block', () => {
      const result = blockService.matchPayload('test', blockEmpty);
      expect(result).toEqual(undefined);
    });

    it('should match payload and return object for label string', () => {
      const location = {
        label: 'Tounes',
        value: 'Tounes',
        type: 'location',
      };
      const result = blockService.matchPayload('Tounes', blockGetStarted);
      expect(result).toEqual(location);
    });

    it('should match payload and return object for value string', () => {
      const result = blockService.matchPayload('GET_STARTED', blockGetStarted);
      expect(result).toEqual({
        label: 'Get Started',
        value: 'GET_STARTED',
      });
    });

    it("should match payload when it's an attachment location", () => {
      const result = blockService.matchPayload(
        {
          type: PayloadType.location,
          coordinates: {
            lat: 15,
            lon: 23,
          },
        },
        blockGetStarted,
      );
      expect(result).toEqual(blockGetStarted.patterns?.[3]);
    });

    it("should match payload when it's an attachment file", () => {
      const result = blockService.matchPayload(
        {
          type: PayloadType.attachments,
          attachment: {
            type: FileType.file,
            payload: {
              id: '9'.repeat(24),
              url: 'http://link.to/the/file',
            },
          },
        },
        blockGetStarted,
      );
      expect(result).toEqual(blockGetStarted.patterns?.[4]);
    });
  });

  describe('matchText', () => {
    it('should return false for matching an empty text', () => {
      const result = blockService.matchText('', blockGetStarted);
      expect(result).toEqual(false);
    });

    it('should match text message', () => {
      const result = blockService.matchText('Hello', blockGetStarted);
      expect(result).toEqual(['Hello']);
    });

    it('should match regex text message', () => {
      const result = blockService.matchText(
        'weeeelcome to our house',
        blockGetStarted,
      );
      expect(result).toEqualPayload(
        ['weeeelcome'],
        ['index', 'index', 'input', 'groups'],
      );
    });

    it("should return false when there's no match", () => {
      const result = blockService.matchText(
        'Goodbye Mr black',
        blockGetStarted,
      );
      expect(result).toEqual(false);
    });

    it('should return false when matching message against a block with no patterns', () => {
      const result = blockService.matchText('Hello', blockEmpty);
      expect(result).toEqual(false);
    });
  });

  describe('processMessage', () => {
    // generic inputs we re-use
    const ctx: Context = {
      vars: {
        phone: '+1123456789',
      },
      user_location: {
        address: undefined,
        lat: 0,
        lon: 0,
      },
      user: { id: 'user-id', first_name: 'Jhon', last_name: 'Doe' } as any,
      skip: {},
      attempt: 0,
    }; // Context
    const subCtx: Subscriber['context'] = {
      vars: {
        color: 'green',
      },
    }; // SubscriberContext
    const conversationId = 'conv-id';

    it('should return a text envelope when the block is a text block', async () => {
      const block = makeMockBlock({
        message: [
          'Hello {{context.user.first_name}}, your phone is {{context.vars.phone}} and your favorite color is {{context.vars.color}}',
        ],
      });

      const env = await blockService.processMessage(
        block,
        ctx,
        subCtx,
        false,
        conversationId,
      );

      expect(env).toEqual({
        format: OutgoingMessageFormat.text,
        message: {
          text: 'Hello Jhon, your phone is +1123456789 and your favorite color is green',
        },
      });
    });

    it('should return a text envelope when the block is a text block (local fallback)', async () => {
      const block = makeMockBlock({
        message: ['Hello world!'],
        options: {
          fallback: {
            active: true,
            max_attempts: 1,
            message: ['Local fallback message ...'],
          },
        },
      });

      const env = await blockService.processMessage(
        block,
        ctx,
        subCtx,
        true,
        conversationId,
      );

      expect(env).toEqual({
        format: OutgoingMessageFormat.text,
        message: {
          text: 'Local fallback message ...',
        },
      });
    });

    it('should return a quick replies envelope when the block message has quickReplies', async () => {
      const block = makeMockBlock({
        message: {
          text: '{{context.user.first_name}}, is this your phone number? {{context.vars.phone}}',
          quickReplies: [
            { content_type: QuickReplyType.text, title: 'Yes', payload: 'YES' },
            { content_type: QuickReplyType.text, title: 'No', payload: 'NO' },
          ],
        },
      });

      const env = await blockService.processMessage(
        block,
        ctx,
        subCtx,
        false,
        conversationId,
      );

      expect(env).toEqual({
        format: OutgoingMessageFormat.quickReplies,
        message: {
          text: 'Jhon, is this your phone number? +1123456789',
          quickReplies: [
            { content_type: QuickReplyType.text, title: 'Yes', payload: 'YES' },
            { content_type: QuickReplyType.text, title: 'No', payload: 'NO' },
          ],
        },
      });
    });

    it('should return a quick replies envelope when the block message has quickReplies (local fallback)', async () => {
      const block = makeMockBlock({
        message: {
          text: '{{context.user.first_name}}, are you there?',
          quickReplies: [
            { content_type: QuickReplyType.text, title: 'Yes', payload: 'YES' },
            { content_type: QuickReplyType.text, title: 'No', payload: 'NO' },
          ],
        },
        options: {
          fallback: {
            active: true,
            max_attempts: 1,
            message: ['Local fallback message ...'],
          },
        },
      });

      const env = await blockService.processMessage(
        block,
        ctx,
        subCtx,
        true,
        conversationId,
      );

      expect(env).toEqual({
        format: OutgoingMessageFormat.quickReplies,
        message: {
          text: 'Local fallback message ...',
          quickReplies: [
            { content_type: QuickReplyType.text, title: 'Yes', payload: 'YES' },
            { content_type: QuickReplyType.text, title: 'No', payload: 'NO' },
          ],
        },
      });
    });

    it('should return a buttons envelope when the block message has buttons', async () => {
      const block = makeMockBlock({
        message: {
          text: '{{context.user.first_name}} {{context.user.last_name}}, what color do you like? {{context.vars.color}}?',
          buttons: [
            { type: ButtonType.postback, title: 'Red', payload: 'RED' },
            { type: ButtonType.postback, title: 'Green', payload: 'GREEN' },
          ],
        },
      });

      const env = await blockService.processMessage(
        block,
        ctx,
        subCtx,
        false,
        conversationId,
      );

      expect(env).toEqual({
        format: OutgoingMessageFormat.buttons,
        message: {
          text: 'Jhon Doe, what color do you like? green?',
          buttons: [
            {
              type: ButtonType.postback,
              title: 'Red',
              payload: 'RED',
            },
            {
              type: ButtonType.postback,
              title: 'Green',
              payload: 'GREEN',
            },
          ],
        },
      });
    });

    it('should return a buttons envelope when the block message has buttons (local fallback)', async () => {
      const block = makeMockBlock({
        message: {
          text: '{{context.user.first_name}} {{context.user.last_name}}, what color do you like? {{context.vars.color}}?',
          buttons: [
            { type: ButtonType.postback, title: 'Red', payload: 'RED' },
            { type: ButtonType.postback, title: 'Green', payload: 'GREEN' },
          ],
        },
        options: {
          fallback: {
            active: true,
            max_attempts: 1,
            message: ['Local fallback message ...'],
          },
        },
      });

      const env = await blockService.processMessage(
        block,
        ctx,
        subCtx,
        true,
        conversationId,
      );

      expect(env).toEqual({
        format: OutgoingMessageFormat.buttons,
        message: {
          text: 'Local fallback message ...',
          buttons: [
            {
              type: ButtonType.postback,
              title: 'Red',
              payload: 'RED',
            },
            {
              type: ButtonType.postback,
              title: 'Green',
              payload: 'GREEN',
            },
          ],
        },
      });
    });

    it('should return an attachment envelope when payload has an id', async () => {
      const block = makeMockBlock({
        message: {
          attachment: {
            type: FileType.image,
            payload: { id: 'ABC123' },
          },
        },
      });

      const env = await blockService.processMessage(
        block,
        ctx,
        subCtx,
        false,
        conversationId,
      );

      expect(env).toEqual({
        format: OutgoingMessageFormat.attachment,
        message: {
          attachment: {
            type: 'image',
            payload: { id: 'ABC123' },
          },
        },
      });
    });

    it('should return an attachment envelope when payload has an id (local fallback)', async () => {
      const block = makeMockBlock({
        message: {
          attachment: {
            type: FileType.image,
            payload: { id: 'ABC123' },
          },
          quickReplies: [],
        },
        options: {
          fallback: {
            active: true,
            max_attempts: 1,
            message: ['Local fallback ...'],
          },
        },
      });

      const env = await blockService.processMessage(
        block,
        ctx,
        subCtx,
        true,
        conversationId,
      );

      expect(env).toEqual({
        format: OutgoingMessageFormat.text,
        message: {
          text: 'Local fallback ...',
        },
      });
    });

    it('should keep quickReplies when present in an attachment block', async () => {
      const block = makeMockBlock({
        message: {
          attachment: {
            type: FileType.video,
            payload: { id: 'VID42' },
          },
          quickReplies: [
            {
              content_type: QuickReplyType.text,
              title: 'Replay',
              payload: 'REPLAY',
            },
            {
              content_type: QuickReplyType.text,
              title: 'Next',
              payload: 'NEXT',
            },
          ],
        },
      });

      const env = await blockService.processMessage(
        block,
        ctx,
        subCtx,
        false,
        conversationId,
      );
      expect(env).toEqual({
        format: OutgoingMessageFormat.attachment,
        message: {
          attachment: {
            type: FileType.video,
            payload: {
              id: 'VID42',
            },
          },
          quickReplies: [
            {
              content_type: QuickReplyType.text,
              title: 'Replay',
              payload: 'REPLAY',
            },
            {
              content_type: QuickReplyType.text,
              title: 'Next',
              payload: 'NEXT',
            },
          ],
        },
      });
    });

    it('should throw when attachment payload misses an id (remote URLs deprecated)', async () => {
      const spyCheckDeprecated = jest
        .spyOn(blockService as any, 'checkDeprecatedAttachmentUrl')
        .mockImplementation(() => {});

      const block = makeMockBlock({
        message: {
          attachment: {
            type: FileType.image,
            payload: { url: 'https://example.com/old-way.png' }, // no "id"
          },
        },
      });

      await expect(
        blockService.processMessage(block, ctx, subCtx, false, conversationId),
      ).rejects.toThrow(
        'Remote attachments in blocks are no longer supported!',
      );

      expect(spyCheckDeprecated).toHaveBeenCalledTimes(1);

      spyCheckDeprecated.mockRestore();
    });

    it('should process list message (with limit = 2 and skip = 0)', async () => {
      const contentType = (await contentTypeService.findOne({
        name: 'Product',
      }))!;
      blockProductListMock.options.content!.entity = contentType.id;
      const result = await blockService.processMessage(
        blockProductListMock,
        {
          ...contextBlankInstance,
          skip: { [blockProductListMock.id]: 0 },
        },
        subscriberContextBlankInstance,
        false,
        'conv_id',
      );
      const elements = await contentService.find(
        { status: true, entity: contentType.id },
        { skip: 0, limit: 2, sort: ['createdAt', 'desc'] },
      );
      const flattenedElements = elements.map(Content.toElement);
      expect(result.format).toEqualPayload(
        blockProductListMock.options.content!.display,
      );
      expect(
        (result.message as StdOutgoingListMessage).elements,
      ).toEqualPayload(flattenedElements);
      expect((result.message as StdOutgoingListMessage).options).toEqualPayload(
        blockProductListMock.options.content!,
      );
      expect(
        (result.message as StdOutgoingListMessage).pagination,
      ).toEqualPayload({ total: 4, skip: 0, limit: 2 });
    });

    it('should process list message (with limit = 2 and skip = 2)', async () => {
      const contentType = (await contentTypeService.findOne({
        name: 'Product',
      }))!;
      blockProductListMock.options.content!.entity = contentType.id;
      const result = await blockService.processMessage(
        blockProductListMock,
        {
          ...contextBlankInstance,
          skip: { [blockProductListMock.id]: 2 },
        },
        subscriberContextBlankInstance,
        false,
        'conv_id',
      );
      const elements = await contentService.find(
        { status: true, entity: contentType.id },
        { skip: 2, limit: 2, sort: ['createdAt', 'desc'] },
      );
      const flattenedElements = elements.map(Content.toElement);
      expect(result.format).toEqual(
        blockProductListMock.options.content?.display,
      );
      expect((result.message as StdOutgoingListMessage).elements).toEqual(
        flattenedElements,
      );
      expect((result.message as StdOutgoingListMessage).options).toEqual(
        blockProductListMock.options.content,
      );
      expect((result.message as StdOutgoingListMessage).pagination).toEqual({
        total: 4,
        skip: 2,
        limit: 2,
      });
    });
  });

  describe('search', () => {
    it('should forward search request to repository', async () => {
      const result = await blockService.search(
        'hasNextBlocks',
        10,
        category.id,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name).toBe('hasNextBlocks');
    });

    it('should use default limit when not specified', async () => {
      const result = await blockService.search('hasNextBlocks');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      // Verify it's using the default limit
    });

    it('should filter by category correctly', async () => {
      const result = await blockService.search(
        'hasNextBlocks',
        10,
        category.id,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((block) => {
        expect(block.category?.toString()).toBe(category.id);
      });
    });

    it('should return search results with scores', async () => {
      const result = await blockService.search('hasNextBlocks', 10);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((block) => {
        expect(block).toHaveProperty('score');
        expect(typeof block.score).toBe('number');
        expect(block.score).toBeGreaterThan(0);
      });
    });

    it('should handle empty search results', async () => {
      const result = await blockService.search('nonexistentblockname', 10);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle repository search errors gracefully', async () => {
      // Mock the repository to throw an error
      jest
        .spyOn(blockRepository, 'search')
        .mockRejectedValue(new Error('MongoDB connection error'));

      await expect(blockService.search('test', 10)).rejects.toThrow(
        'MongoDB connection error',
      );
    });
  });
});
