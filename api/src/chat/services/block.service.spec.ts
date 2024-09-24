/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import {
  subscriberWithLabels,
  subscriberWithoutLabels,
} from '@/channel/lib/__test__/subscriber.mock';
import { ContentTypeRepository } from '@/cms/repositories/content-type.repository';
import { ContentRepository } from '@/cms/repositories/content.repository';
import { ContentTypeModel } from '@/cms/schemas/content-type.schema';
import { Content, ContentModel } from '@/cms/schemas/content.schema';
import { ContentTypeService } from '@/cms/services/content-type.service';
import { ContentService } from '@/cms/services/content.service';
import OfflineHandler from '@/extensions/channels/offline/index.channel';
import { OFFLINE_CHANNEL_NAME } from '@/extensions/channels/offline/settings';
import { Offline } from '@/extensions/channels/offline/types';
import OfflineEventWrapper from '@/extensions/channels/offline/wrapper';
import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { LanguageModel } from '@/i18n/schemas/language.schema';
import { I18nService } from '@/i18n/services/i18n.service';
import { LanguageService } from '@/i18n/services/language.service';
import { LoggerService } from '@/logger/logger.service';
import { PluginService } from '@/plugins/plugins.service';
import { Settings } from '@/setting/schemas/types';
import { SettingService } from '@/setting/services/setting.service';
import {
  blockFixtures,
  installBlockFixtures,
} from '@/utils/test/fixtures/block';
import { installContentFixtures } from '@/utils/test/fixtures/content';
import {
  blockEmpty,
  blockGetStarted,
  blockProductListMock,
  blocks,
} from '@/utils/test/mocks/block';
import {
  contextBlankInstance,
  contextEmailVarInstance,
  contextGetStartedInstance,
} from '@/utils/test/mocks/conversation';
import { nlpEntitiesGreeting } from '@/utils/test/mocks/nlp';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { CategoryRepository } from './../repositories/category.repository';
import { BlockService } from './block.service';
import { CategoryService } from './category.service';
import { BlockRepository } from '../repositories/block.repository';
import { Block, BlockModel } from '../schemas/block.schema';
import { Category, CategoryModel } from '../schemas/category.schema';
import { LabelModel } from '../schemas/label.schema';
import { FileType } from '../schemas/types/attachment';
import { Context } from '../schemas/types/context';
import { PayloadType, StdOutgoingListMessage } from '../schemas/types/message';

describe('BlockService', () => {
  let blockRepository: BlockRepository;
  let categoryRepository: CategoryRepository;
  let category: Category;
  let block: Block;
  let blockService: BlockService;
  let hasPreviousBlocks: Block;
  let contentService: ContentService;
  let contentTypeService: ContentTypeService;
  let settingService: SettingService;
  let settings: Settings;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(async () => {
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
          LanguageModel,
        ]),
      ],
      providers: [
        BlockRepository,
        CategoryRepository,
        ContentTypeRepository,
        ContentRepository,
        AttachmentRepository,
        LanguageRepository,
        BlockService,
        CategoryService,
        ContentTypeService,
        ContentService,
        AttachmentService,
        LanguageService,
        {
          provide: PluginService,
          useValue: {},
        },
        LoggerService,
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => {
              return t === 'Welcome' ? 'Bienvenue' : t;
            }),
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
        EventEmitter2,
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
    blockService = module.get<BlockService>(BlockService);
    contentService = module.get<ContentService>(ContentService);
    settingService = module.get<SettingService>(SettingService);
    contentTypeService = module.get<ContentTypeService>(ContentTypeService);
    categoryRepository = module.get<CategoryRepository>(CategoryRepository);
    blockRepository = module.get<BlockRepository>(BlockRepository);
    category = await categoryRepository.findOne({ label: 'default' });
    hasPreviousBlocks = await blockRepository.findOne({
      name: 'hasPreviousBlocks',
    });
    block = await blockRepository.findOne({ name: 'hasNextBlocks' });
    settings = await settingService.getSettings();
  });

  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);

  describe('findOneAndPopulate', () => {
    it('should find one block by id, and populate its trigger_labels, assign_labels,attachedBlock,category,nextBlocks', async () => {
      jest.spyOn(blockRepository, 'findOneAndPopulate');
      const result = await blockService.findOneAndPopulate(block.id);

      expect(blockRepository.findOneAndPopulate).toHaveBeenCalledWith(block.id);
      expect(result).toEqualPayload({
        ...blockFixtures.find(({ name }) => name === 'hasNextBlocks'),
        category,
        nextBlocks: [hasPreviousBlocks],
        previousBlocks: [],
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
      }));

      expect(blockRepository.findAndPopulate).toHaveBeenCalledWith(
        {},
        undefined,
      );
      expect(result).toEqualPayload(blocksWithCategory);
    });
  });

  describe('getRandom', () => {
    it('should get a random message', () => {
      const messages = [
        'Hello, this is Nour',
        'Oh ! How are you ?',
        "Hmmm that's cool !",
        'Corona virus',
        'God bless you',
      ];
      const result = blockService.getRandom(messages);
      expect(messages).toContain(result);
    });

    it('should return undefined when trying to get a random message from an empty array', () => {
      const result = blockService.getRandom([]);
      expect(result).toBe(undefined);
    });
  });

  describe('match', () => {
    const handlerMock = {
      getChannel: jest.fn(() => OFFLINE_CHANNEL_NAME),
    } as any as OfflineHandler;
    const offlineEventGreeting = new OfflineEventWrapper(
      handlerMock,
      {
        type: Offline.IncomingMessageType.text,
        data: {
          text: 'Hello',
        },
      },
      {},
    );
    const offlineEventGetStarted = new OfflineEventWrapper(
      handlerMock,
      {
        type: Offline.IncomingMessageType.postback,
        data: {
          text: 'Get Started',
          payload: 'GET_STARTED',
        },
      },
      {},
    );

    it('should return undefined when no blocks are provided', async () => {
      const result = await blockService.match([], offlineEventGreeting);
      expect(result).toBe(undefined);
    });

    it('should return undefined for empty blocks', async () => {
      const result = await blockService.match(
        [blockEmpty],
        offlineEventGreeting,
      );
      expect(result).toEqual(undefined);
    });

    it('should return undefined for no matching labels', async () => {
      offlineEventGreeting.setSender(subscriberWithoutLabels);
      const result = await blockService.match(blocks, offlineEventGreeting);
      expect(result).toEqual(undefined);
    });

    it('should match block text and labels', async () => {
      offlineEventGreeting.setSender(subscriberWithLabels);
      const result = await blockService.match(blocks, offlineEventGreeting);
      expect(result).toEqual(blockGetStarted);
    });

    it('should match block with payload', async () => {
      offlineEventGetStarted.setSender(subscriberWithLabels);
      const result = await blockService.match(blocks, offlineEventGetStarted);
      expect(result).toEqual(blockGetStarted);
    });

    it('should match block with nlp', async () => {
      offlineEventGreeting.setSender(subscriberWithLabels);
      offlineEventGreeting.setNLP(nlpEntitiesGreeting);
      const result = await blockService.match(blocks, offlineEventGreeting);
      expect(result).toEqual(blockGetStarted);
    });
  });

  describe('matchNLP', () => {
    it('should return undefined for match nlp against a block with no patterns', () => {
      const result = blockService.matchNLP(nlpEntitiesGreeting, blockEmpty);
      expect(result).toEqual(undefined);
    });

    it('should return undefined for match nlp when no nlp entities are provided', () => {
      const result = blockService.matchNLP({ entities: [] }, blockGetStarted);
      expect(result).toEqual(undefined);
    });

    it('should return match nlp patterns', () => {
      const result = blockService.matchNLP(
        nlpEntitiesGreeting,
        blockGetStarted,
      );
      expect(result).toEqual([
        {
          entity: 'intent',
          match: 'value',
          value: 'greeting',
        },
        {
          entity: 'firstname',
          match: 'entity',
        },
      ]);
    });

    it('should return undefined when it does not match nlp patterns', () => {
      const result = blockService.matchNLP(nlpEntitiesGreeting, {
        ...blockGetStarted,
        patterns: [[{ entity: 'lastname', match: 'value', value: 'Belakhel' }]],
      });
      expect(result).toEqual(undefined);
    });

    it('should return undefined when unknown nlp patterns', () => {
      const result = blockService.matchNLP(nlpEntitiesGreeting, {
        ...blockGetStarted,
        patterns: [[{ entity: 'product', match: 'value', value: 'pizza' }]],
      });
      expect(result).toEqual(undefined);
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
      expect(result).toEqual(blockGetStarted.patterns[3]);
    });

    it("should match payload when it's an attachment file", () => {
      const result = blockService.matchPayload(
        {
          type: PayloadType.attachments,
          attachments: {
            type: FileType.file,
            payload: {
              url: 'http://link.to/the/file',
            },
          },
        },
        blockGetStarted,
      );
      expect(result).toEqual(blockGetStarted.patterns[4]);
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
    it('should process list message (with limit = 2 and skip = 0)', async () => {
      const contentType = await contentTypeService.findOne({ name: 'Product' });
      blockProductListMock.options.content.entity = contentType.id;
      const result = await blockService.processMessage(
        blockProductListMock,
        {
          ...contextBlankInstance,
          skip: { [blockProductListMock.id]: 0 },
        },
        false,
        'conv_id',
      );
      const elements = await contentService.findPage(
        { status: true, entity: contentType.id },
        { skip: 0, limit: 2, sort: ['createdAt', 'desc'] },
      );
      const flattenedElements = elements.map((element) =>
        Content.flatDynamicFields(element),
      );
      expect(result.format).toEqualPayload(
        blockProductListMock.options.content?.display,
      );
      expect(
        (result.message as StdOutgoingListMessage).elements,
      ).toEqualPayload(flattenedElements);
      expect((result.message as StdOutgoingListMessage).options).toEqualPayload(
        blockProductListMock.options.content,
      );
      expect(
        (result.message as StdOutgoingListMessage).pagination,
      ).toEqualPayload({ total: 4, skip: 0, limit: 2 });
    });

    it('should process list message (with limit = 2 and skip = 2)', async () => {
      const contentType = await contentTypeService.findOne({ name: 'Product' });
      blockProductListMock.options.content.entity = contentType.id;
      const result = await blockService.processMessage(
        blockProductListMock,
        {
          ...contextBlankInstance,
          skip: { [blockProductListMock.id]: 2 },
        },
        false,
        'conv_id',
      );
      const elements = await contentService.findPage(
        { status: true, entity: contentType.id },
        { skip: 2, limit: 2, sort: ['createdAt', 'desc'] },
      );
      const flattenedElements = elements.map((element) =>
        Content.flatDynamicFields(element),
      );
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

  describe('processText', () => {
    const context: Context = {
      ...contextGetStartedInstance,
      channel: 'offline',
      text: '',
      payload: undefined,
      nlp: { entities: [] },
      vars: { age: 21, email: 'email@example.com' },
      user_location: {
        address: { address: 'sangafora' },
        lat: 23,
        lon: 16,
      },
      user: subscriberWithoutLabels,
      skip: { '1': 0 },
      attempt: 0,
    };

    it('should process empty text', () => {
      const result = blockService.processText('', context, settings);
      expect(result).toEqual('');
    });

    it('should process text translation', () => {
      const translation = { en: 'Welcome', fr: 'Bienvenue' };
      const result = blockService.processText(
        translation.en,
        context,
        settings,
      );
      expect(result).toEqual(translation.fr);
    });

    it('should process text replacements with ontext vars', () => {
      const result = blockService.processText(
        '{context.user.first_name} {context.user.last_name}, email : {context.vars.email}',
        contextEmailVarInstance,
        settings,
      );
      expect(result).toEqual('John Doe, email : email@example.com');
    });

    it('should process text replacements with context vars', () => {
      const result = blockService.processText(
        '{context.user.first_name} {context.user.last_name}, email : {context.vars.email}',
        contextEmailVarInstance,
        settings,
      );
      expect(result).toEqual('John Doe, email : email@example.com');
    });

    it('should process text replacements with settings contact infos', () => {
      const result = blockService.processText(
        'Trying the settings : the name of company is <<{contact.company_name}>>',
        contextBlankInstance,
        settings,
      );
      expect(result).toEqual(
        'Trying the settings : the name of company is <<Your company name>>',
      );
    });
  });
});
