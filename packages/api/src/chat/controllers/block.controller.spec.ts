/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { BlockOrmEntity } from '@/chat/entities/block.entity';
import { CategoryOrmEntity } from '@/chat/entities/category.entity';
import { ConversationOrmEntity } from '@/chat/entities/conversation.entity';
import { LabelGroupOrmEntity } from '@/chat/entities/label-group.entity';
import { LabelOrmEntity } from '@/chat/entities/label.entity';
import { SubscriberOrmEntity } from '@/chat/entities/subscriber.entity';
import { ContentTypeOrmEntity } from '@/cms/entities/content-type.entity';
import { ContentOrmEntity } from '@/cms/entities/content.entity';
import { ContentService } from '@/cms/services/content.service';
import { I18nService } from '@/i18n/services/i18n.service';
import { LanguageService } from '@/i18n/services/language.service';
import { NlpEntityOrmEntity } from '@/nlp/entities/nlp-entity.entity';
import { NlpSampleEntityOrmEntity } from '@/nlp/entities/nlp-sample-entity.entity';
import { NlpSampleOrmEntity } from '@/nlp/entities/nlp-sample.entity';
import { NlpValueOrmEntity } from '@/nlp/entities/nlp-value.entity';
import { NlpService } from '@/nlp/services/nlp.service';
import { PluginService } from '@/plugins/plugins.service';
import { SettingService } from '@/setting/services/setting.service';
import { ModelOrmEntity } from '@/user/entities/model.entity';
import { PermissionOrmEntity } from '@/user/entities/permission.entity';
import { RoleOrmEntity } from '@/user/entities/role.entity';
import { UserProfileOrmEntity } from '@/user/entities/user-profile.entity';
import { UserOrmEntity } from '@/user/entities/user.entity';
import { UserService } from '@/user/services/user.service';
import {
  blockFixtures,
  installBlockFixturesTypeOrm,
} from '@/utils/test/fixtures/block';
import { installCategoryFixturesTypeOrm } from '@/utils/test/fixtures/category';
import { installLabelFixturesTypeOrm } from '@/utils/test/fixtures/label';
import { installNlpSampleEntityFixturesTypeOrm } from '@/utils/test/fixtures/nlpsampleentity';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { DEFAULT_BLOCK_SEARCH_LIMIT } from '../constants/block';
import {
  Block,
  BlockCreateDto,
  BlockFull,
  BlockSearchQueryDto,
  BlockUpdateDto,
} from '../dto/block.dto';
import { Category } from '../dto/category.dto';
import { CategoryRepository } from '../repositories/category.repository';
import { BlockService } from '../services/block.service';
import { CategoryService } from '../services/category.service';
import { PayloadType } from '../types/button';

import { BlockController } from './block.controller';

const UNKNOWN_BLOCK_ID = '99999999-9999-4999-9999-999999999999';
const DEFAULT_SETTINGS = {
  chatbot_settings: {
    global_fallback: true,
    fallback_block: null,
  },
} as const;
const settingServiceMock = {
  getSettings: jest.fn().mockResolvedValue(DEFAULT_SETTINGS),
};
const pluginServiceMock = {
  getPlugin: jest.fn(),
  getAllByType: jest.fn().mockReturnValue([]),
};
const userServiceMock = {
  findOne: jest.fn().mockResolvedValue(null),
};
const contentServiceMock = {};
const languageServiceMock = {};
const nlpServiceMock = {};
const i18nServiceMock = {
  t: jest.fn().mockImplementation((translationKey: string) => translationKey),
};
const FIELDS_TO_POPULATE = [
  'trigger_labels',
  'assign_labels',
  'nextBlocks',
  'attachedBlock',
  'category',
  'previousBlocks',
];

function createSearchQuery(
  data: Partial<BlockSearchQueryDto>,
): BlockSearchQueryDto {
  return Object.assign(new BlockSearchQueryDto(), data);
}

describe('BlockController (TypeORM)', () => {
  let module: TestingModule;
  let blockController: BlockController;
  let blockService: BlockService;
  let categoryService: CategoryService;

  let defaultCategory: Category;
  let defaultBlock: Block;
  let hasNextBlocks: Block;
  let hasPreviousBlocks: Block;

  const buildBlockPayload = (
    overrides: Partial<BlockCreateDto> = {},
  ): BlockCreateDto => {
    if (!defaultCategory) {
      throw new Error('Category fixtures not loaded');
    }

    return {
      name: `block-${Math.random().toString(36).slice(2, 10)}`,
      nextBlocks: [],
      patterns: ['Hi'],
      outcomes: [],
      trigger_labels: [],
      assign_labels: [],
      trigger_channels: [],
      category: defaultCategory.id,
      options: {
        typing: 0,
        fallback: {
          active: false,
          max_attempts: 1,
          message: [],
        },
      },
      message: ['Hi back !'],
      starts_conversation: false,
      capture_vars: [],
      position: {
        x: 0,
        y: 0,
      },
      ...overrides,
    };
  };

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['controllers'],
      controllers: [BlockController],
      providers: [
        CategoryService,
        CategoryRepository,
        { provide: PluginService, useValue: pluginServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: ContentService, useValue: contentServiceMock },
        { provide: LanguageService, useValue: languageServiceMock },
        { provide: NlpService, useValue: nlpServiceMock },
        { provide: SettingService, useValue: settingServiceMock },
        { provide: I18nService, useValue: i18nServiceMock },
      ],
      typeorm: {
        entities: [
          UserProfileOrmEntity,
          BlockOrmEntity,
          CategoryOrmEntity,
          LabelOrmEntity,
          LabelGroupOrmEntity,
          SubscriberOrmEntity,
          ConversationOrmEntity,
          AttachmentOrmEntity,
          UserOrmEntity,
          RoleOrmEntity,
          PermissionOrmEntity,
          ModelOrmEntity,
          NlpEntityOrmEntity,
          NlpValueOrmEntity,
          NlpSampleOrmEntity,
          NlpSampleEntityOrmEntity,
          ContentOrmEntity,
          ContentTypeOrmEntity,
        ],
        fixtures: [
          installCategoryFixturesTypeOrm,
          installLabelFixturesTypeOrm,
          installBlockFixturesTypeOrm,
          installNlpSampleEntityFixturesTypeOrm,
        ],
      },
    });

    module = testing.module;

    [blockController, blockService, categoryService] = await testing.getMocks([
      BlockController,
      BlockService,
      CategoryService,
    ]);

    const category = await categoryService.findOne({
      where: { label: 'default' },
    });
    if (!category) {
      throw new Error('Expected "default" category fixture to be available');
    }
    defaultCategory = category;

    const block = await blockService.findOne({
      where: { name: 'test' },
    });
    defaultBlock = block!;

    const nextBlock = await blockService.findOne({
      where: { name: 'hasNextBlocks' },
    });
    if (!nextBlock) {
      throw new Error('Expected "hasNextBlocks" fixture to be available');
    }
    hasNextBlocks = nextBlock;

    const previousBlock = await blockService.findOne({
      where: { name: 'hasPreviousBlocks' },
    });
    if (!previousBlock) {
      throw new Error('Expected "hasPreviousBlocks" fixture to be available');
    }
    hasPreviousBlocks = previousBlock;
  });

  beforeEach(() => {
    pluginServiceMock.getAllByType.mockReturnValue([]);
    pluginServiceMock.getPlugin.mockReturnValue(undefined);
    settingServiceMock.getSettings.mockResolvedValue(DEFAULT_SETTINGS);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('find', () => {
    it('should return all blocks without populating relations when none requested', async () => {
      const expected = await blockService.find({});
      const findSpy = jest
        .spyOn(blockService, 'find')
        .mockResolvedValue(expected);
      const result = await blockController.find([], {} as any);

      expect(findSpy).toHaveBeenCalledWith({});
      expect(result).toBe(expected);
    });

    it('should populate relations when requested', async () => {
      const expected = await blockService.findAndPopulate({});
      const findAndPopulateSpy = jest
        .spyOn(blockService, 'findAndPopulate')
        .mockResolvedValue(expected);
      const result = await blockController.find(FIELDS_TO_POPULATE, {} as any);

      expect(findAndPopulateSpy).toHaveBeenCalledWith({});
      expect(result).toBe(expected);
    });
  });

  describe('search', () => {
    it('should return empty array when query is empty', async () => {
      const query = createSearchQuery({ q: '' });
      const result = await blockController.search(query);
      expect(result).toEqual([]);
    });

    it('should delegate search to service with correct parameters', async () => {
      const query = createSearchQuery({
        q: 'hasNextBlocks',
        limit: 10,
        category: defaultCategory.id,
      });
      const searchSpy = jest.spyOn(blockService, 'search');
      const result = await blockController.search(query);

      expect(searchSpy).toHaveBeenCalledWith(
        'hasNextBlocks',
        10,
        defaultCategory.id,
      );
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((block) => block.name === 'hasNextBlocks')).toBe(true);
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Block search failed');
      jest.spyOn(blockService, 'search').mockRejectedValueOnce(error);

      const query = createSearchQuery({ q: 'error' });
      await expect(blockController.search(query)).rejects.toThrow(
        'Block search failed',
      );
    });

    it('should use default limit when not specified', async () => {
      const searchSpy = jest.spyOn(blockService, 'search');
      const query = createSearchQuery({ q: 'hasNextBlocks' });
      await blockController.search(query);

      expect(searchSpy).toHaveBeenCalledWith(
        'hasNextBlocks',
        DEFAULT_BLOCK_SEARCH_LIMIT,
        undefined,
      );
    });

    it('should filter by category when provided', async () => {
      const query = createSearchQuery({
        q: 'hasNextBlocks',
        category: defaultCategory.id,
      });
      const result = await blockController.search(query);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((block) => {
        expect(block.category).toBe(defaultCategory.id);
      });
    });
  });

  describe('findOne', () => {
    it('should find one block by id', async () => {
      const findOneSpy = jest.spyOn(blockService, 'findOne');
      const result = await blockController.findOne(hasNextBlocks.id, []);

      expect(findOneSpy).toHaveBeenCalledWith(hasNextBlocks.id);
      expect(result).toMatchObject({
        id: hasNextBlocks.id,
        name: hasNextBlocks.name,
        category: hasNextBlocks.category,
        nextBlocks: hasNextBlocks.nextBlocks,
      });
    });

    it('should find one block by id and populate relations', async () => {
      const findOneAndPopulateSpy = jest.spyOn(
        blockService,
        'findOneAndPopulate',
      );
      const result = await blockController.findOne(
        hasPreviousBlocks.id,
        FIELDS_TO_POPULATE,
      );

      expect(findOneAndPopulateSpy).toHaveBeenCalledWith(hasPreviousBlocks.id);
      const populated = result as BlockFull;
      expect(populated.category?.id).toBe(defaultCategory.id);
      expect(
        (populated.previousBlocks ?? []).some(
          (block) => block.id === hasNextBlocks.id,
        ),
      ).toBe(true);
    });

    it('should find one attachment block with empty previousBlocks when populated', async () => {
      const attachmentFixture = blockFixtures.find(
        ({ name }) => name === 'attachment',
      );
      if (!attachmentFixture) {
        throw new Error('Expected "attachment" block fixture to be available');
      }
      const attachmentBlock = await blockService.findOne({
        where: { name: 'attachment' },
      });
      if (!attachmentBlock) {
        throw new Error('Expected "attachment" block to exist');
      }

      const result = (await blockController.findOne(
        attachmentBlock.id,
        FIELDS_TO_POPULATE,
      )) as BlockFull;

      expect(result.category?.id).toBe(defaultCategory.id);
      expect(result.previousBlocks).toEqual([]);
      expect(result.attachedToBlock).toBeNull();
      expect(result.message).toEqual(attachmentFixture.message);
    });
  });

  describe('create', () => {
    it('should return created block', async () => {
      const createSpy = jest.spyOn(blockService, 'create');
      const payload = buildBlockPayload({
        name: 'block-with-next',
        nextBlocks: [hasNextBlocks.id],
      });
      const result = await blockController.create(payload);

      expect(createSpy).toHaveBeenCalledWith(payload);
      expect(result).toMatchObject({
        name: payload.name,
        category: payload.category,
        nextBlocks: payload.nextBlocks,
      });

      await blockService.deleteOne(result.id);
    });
  });

  describe('deleteOne', () => {
    it('should delete block', async () => {
      const blockToDelete = await blockService.create(
        buildBlockPayload({ name: 'block-to-delete' }),
      );
      const deleteSpy = jest.spyOn(blockService, 'deleteOne');
      const result = await blockController.deleteOne(blockToDelete.id);

      expect(deleteSpy).toHaveBeenCalledWith(blockToDelete.id);
      expect(result).toEqual({ acknowledged: true, deletedCount: 1 });
    });

    it('should throw NotFoundException when attempting to delete a missing block', async () => {
      const nonExistingId = UNKNOWN_BLOCK_ID;

      await expect(blockController.deleteOne(nonExistingId)).rejects.toThrow(
        new NotFoundException(`Block with ID ${nonExistingId} not found`),
      );
    });
  });

  describe('updateOne', () => {
    it('should return updated block', async () => {
      const updateBlock: BlockUpdateDto = {
        name: 'modified block name',
      };
      const updateOneSpy = jest.spyOn(blockService, 'updateOne');
      const result = await blockController.updateOne(
        defaultBlock.id,
        updateBlock,
      );

      expect(updateOneSpy).toHaveBeenCalledWith(defaultBlock.id, updateBlock);
      expect(result).toMatchObject({
        id: defaultBlock.id,
        name: updateBlock.name,
        category: defaultBlock.category,
      });
    });

    it('should throw NotFoundException when attempting to update a missing block', async () => {
      const updateBlock: BlockUpdateDto = {
        name: 'attempt to modify block name',
      };

      await expect(
        blockController.updateOne(UNKNOWN_BLOCK_ID, updateBlock),
      ).rejects.toThrow('Unable to execute updateOne() - No updates');
    });
  });

  it('should update block trigger to postback menu', async () => {
    const updateBlock: BlockUpdateDto = {
      patterns: [
        {
          label: 'postback123',
          value: 'postback123',
          type: PayloadType.menu,
        },
      ],
    };
    const updateOneSpy = jest.spyOn(blockService, 'updateOne');
    const result = await blockController.updateOne(
      defaultBlock.id,
      updateBlock,
    );

    expect(updateOneSpy).toHaveBeenCalledWith(defaultBlock.id, updateBlock);
    expect(
      result.patterns.find(
        (pattern) =>
          typeof pattern === 'object' &&
          'type' in pattern &&
          pattern.type === PayloadType.menu,
      ),
    ).toBeDefined();
    expect(result.patterns).toEqual(updateBlock.patterns);
  });

  it('should update the block trigger with a content payload type', async () => {
    const updateBlock: BlockUpdateDto = {
      patterns: [
        {
          label: 'Content label',
          value: 'Content value',
          type: PayloadType.content,
        },
      ],
    };
    const updateOneSpy = jest.spyOn(blockService, 'updateOne');
    const result = await blockController.updateOne(
      defaultBlock.id,
      updateBlock,
    );

    expect(updateOneSpy).toHaveBeenCalledWith(defaultBlock.id, updateBlock);
    expect(
      result.patterns.find(
        (pattern) =>
          typeof pattern === 'object' &&
          'type' in pattern &&
          pattern.type === PayloadType.content,
      ),
    ).toBeDefined();
    expect(result.patterns).toEqual(updateBlock.patterns);
  });
});
