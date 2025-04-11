/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { ContentRepository } from '@/cms/repositories/content.repository';
import { ContentModel } from '@/cms/schemas/content.schema';
import { ContentService } from '@/cms/services/content.service';
import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { LanguageModel } from '@/i18n/schemas/language.schema';
import { I18nService } from '@/i18n/services/i18n.service';
import { LanguageService } from '@/i18n/services/language.service';
import { PluginService } from '@/plugins/plugins.service';
import { SettingService } from '@/setting/services/setting.service';
import { InvitationRepository } from '@/user/repositories/invitation.repository';
import { PermissionRepository } from '@/user/repositories/permission.repository';
import { RoleRepository } from '@/user/repositories/role.repository';
import { UserRepository } from '@/user/repositories/user.repository';
import { InvitationModel } from '@/user/schemas/invitation.schema';
import { PermissionModel } from '@/user/schemas/permission.schema';
import { RoleModel } from '@/user/schemas/role.schema';
import { UserModel } from '@/user/schemas/user.schema';
import { PermissionService } from '@/user/services/permission.service';
import { RoleService } from '@/user/services/role.service';
import { UserService } from '@/user/services/user.service';
import { IGNORED_TEST_FIELDS } from '@/utils/test/constants';
import { getUpdateOneError } from '@/utils/test/errors/messages';
import {
  blockFixtures,
  installBlockFixtures,
} from '@/utils/test/fixtures/block';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { BlockCreateDto, BlockUpdateDto } from '../dto/block.dto';
import { BlockRepository } from '../repositories/block.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { LabelRepository } from '../repositories/label.repository';
import { Block, BlockModel } from '../schemas/block.schema';
import { LabelModel } from '../schemas/label.schema';
import { PayloadType } from '../schemas/types/button';
import { BlockService } from '../services/block.service';
import { CategoryService } from '../services/category.service';
import { LabelService } from '../services/label.service';

import { Category, CategoryModel } from './../schemas/category.schema';
import { BlockController } from './block.controller';

describe('BlockController', () => {
  let blockController: BlockController;
  let blockService: BlockService;
  let categoryService: CategoryService;
  let category: Category;
  let block: Block;
  let blockToDelete: Block;
  let hasNextBlocks: Block;
  let hasPreviousBlocks: Block;
  const FIELDS_TO_POPULATE = [
    'trigger_labels',
    'assign_labels',
    'nextBlocks',
    'attachedBlock',
    'category',
    'previousBlocks',
  ];

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      controllers: [BlockController],
      imports: [
        rootMongooseTestModule(installBlockFixtures),
        MongooseModule.forFeature([
          BlockModel,
          LabelModel,
          CategoryModel,
          ContentModel,
          InvitationModel,
          AttachmentModel,
          UserModel,
          RoleModel,
          PermissionModel,
          LanguageModel,
        ]),
      ],
      providers: [
        BlockRepository,
        LabelRepository,
        CategoryRepository,
        ContentRepository,
        AttachmentRepository,
        UserRepository,
        RoleRepository,
        PermissionRepository,
        InvitationRepository,
        LanguageRepository,
        BlockService,
        LabelService,
        CategoryService,
        ContentService,
        AttachmentService,
        UserService,
        RoleService,
        PermissionService,
        LanguageService,
        PluginService,
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
            getSettings: jest.fn(() => ({})),
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
    [blockController, blockService, categoryService] = await getMocks([
      BlockController,
      BlockService,
      CategoryService,
    ]);
    category = (await categoryService.findOne({ label: 'default' }))!;
    block = (await blockService.findOne({ name: 'first' }))!;
    blockToDelete = (await blockService.findOne({ name: 'buttons' }))!;
    hasNextBlocks = (await blockService.findOne({
      name: 'hasNextBlocks',
    }))!;
    hasPreviousBlocks = (await blockService.findOne({
      name: 'hasPreviousBlocks',
    }))!;
  });

  afterEach(jest.clearAllMocks);

  afterAll(closeInMongodConnection);

  describe('find', () => {
    it('should find all blocks', async () => {
      jest.spyOn(blockService, 'find');
      const result = await blockController.find([], {});
      const blocksWithCategory = blockFixtures.map((blockFixture) => ({
        ...blockFixture,
        category: category.id,
        nextBlocks:
          blockFixture.name === 'hasNextBlocks' ? [hasPreviousBlocks.id] : [],
      }));

      expect(blockService.find).toHaveBeenCalledWith({}, undefined);
      expect(result).toEqualPayload(blocksWithCategory, [
        ...IGNORED_TEST_FIELDS,
        'attachedToBlock',
      ]);
    });

    it('should find all blocks, and foreach block populate the corresponding category and previousBlocks', async () => {
      jest.spyOn(blockService, 'findAndPopulate');
      const category = await categoryService.findOne({ label: 'default' });
      const result = await blockController.find(FIELDS_TO_POPULATE, {});
      const blocksWithCategory = blockFixtures.map((blockFixture) => ({
        ...blockFixture,
        category,
        previousBlocks:
          blockFixture.name === 'hasPreviousBlocks' ? [hasNextBlocks] : [],
        nextBlocks:
          blockFixture.name === 'hasNextBlocks' ? [hasPreviousBlocks] : [],
        attachedToBlock: null,
      }));

      expect(blockService.findAndPopulate).toHaveBeenCalledWith({}, undefined);
      expect(result).toEqualPayload(blocksWithCategory);
    });
  });

  describe('findOne', () => {
    it('should find one block by id', async () => {
      jest.spyOn(blockService, 'findOne');
      const result = await blockController.findOne(hasNextBlocks.id, []);
      expect(blockService.findOne).toHaveBeenCalledWith(hasNextBlocks.id);
      expect(result).toEqualPayload(
        {
          ...blockFixtures.find(({ name }) => name === hasNextBlocks.name),
          category: category.id,
          nextBlocks: [hasPreviousBlocks.id],
        },
        [...IGNORED_TEST_FIELDS, 'attachedToBlock'],
      );
    });

    it('should find one block by id, and populate its category and previousBlocks', async () => {
      jest.spyOn(blockService, 'findOneAndPopulate');
      const result = await blockController.findOne(
        hasPreviousBlocks.id,
        FIELDS_TO_POPULATE,
      );
      expect(blockService.findOneAndPopulate).toHaveBeenCalledWith(
        hasPreviousBlocks.id,
      );
      expect(result).toEqualPayload({
        ...blockFixtures.find(({ name }) => name === 'hasPreviousBlocks'),
        category,
        previousBlocks: [hasNextBlocks],
        attachedToBlock: null,
      });
    });

    it('should find one block by id, and populate its category and an empty previousBlocks', async () => {
      jest.spyOn(blockService, 'findOneAndPopulate');
      block = (await blockService.findOne({ name: 'attachment' }))!;
      const result = await blockController.findOne(
        block.id,
        FIELDS_TO_POPULATE,
      );
      expect(blockService.findOneAndPopulate).toHaveBeenCalledWith(block.id);
      expect(result).toEqualPayload({
        ...blockFixtures.find(({ name }) => name === 'attachment'),
        category,
        previousBlocks: [],
        attachedToBlock: null,
      });
    });
  });

  describe('create', () => {
    it('should return created block', async () => {
      jest.spyOn(blockService, 'create');
      const mockedBlockCreateDto: BlockCreateDto = {
        name: 'block with nextBlocks',
        nextBlocks: [hasNextBlocks.id],
        patterns: ['Hi'],
        outcomes: [],
        trigger_labels: [],
        assign_labels: [],
        trigger_channels: [],
        category: category.id,
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
      };
      const result = await blockController.create(mockedBlockCreateDto);

      expect(blockService.create).toHaveBeenCalledWith(mockedBlockCreateDto);
      expect(result).toEqualPayload(
        {
          ...mockedBlockCreateDto,
        },
        [...IGNORED_TEST_FIELDS, 'nextBlocks', 'builtin'],
      );
    });
  });

  describe('deleteOne', () => {
    it('should delete block', async () => {
      jest.spyOn(blockService, 'deleteOne');
      const result = await blockController.deleteOne(blockToDelete.id);

      expect(blockService.deleteOne).toHaveBeenCalledWith(blockToDelete.id);
      expect(result).toEqual({ acknowledged: true, deletedCount: 1 });
    });

    it('should throw NotFoundException when attempting to delete a block by id', async () => {
      await expect(blockController.deleteOne(blockToDelete.id)).rejects.toThrow(
        new NotFoundException(`Block with ID ${blockToDelete.id} not found`),
      );
    });
  });

  describe('updateOne', () => {
    it('should return updated block', async () => {
      jest.spyOn(blockService, 'updateOne');
      const updateBlock: BlockUpdateDto = {
        name: 'modified block name',
      };
      const result = await blockController.updateOne(block.id, updateBlock);

      expect(blockService.updateOne).toHaveBeenCalledWith(
        block.id,
        updateBlock,
      );
      expect(result).toEqualPayload(
        {
          ...blockFixtures.find(({ name }) => name === block.name),
          category: category.id,
          ...updateBlock,
        },
        [...IGNORED_TEST_FIELDS, 'attachedToBlock'],
      );
    });

    it('should throw NotFoundException when attempting to update a block by id', async () => {
      const updateBlock: BlockUpdateDto = {
        name: 'attempt to modify block name',
      };

      await expect(
        blockController.updateOne(blockToDelete.id, updateBlock),
      ).rejects.toThrow(getUpdateOneError(Block.name, blockToDelete.id));
    });
  });

  it('should update block trigger to postback menu', async () => {
    jest.spyOn(blockService, 'updateOne');
    const updateBlock: BlockUpdateDto = {
      patterns: [
        {
          label: 'postback123',
          value: 'postback123',
          type: PayloadType.menu,
        },
      ],
    };
    const result = await blockController.updateOne(block.id, updateBlock);
    expect(blockService.updateOne).toHaveBeenCalledWith(block.id, updateBlock);

    expect(
      result.patterns.find(
        (pattern) =>
          typeof pattern === 'object' &&
          'type' in pattern &&
          pattern.type === PayloadType.menu &&
          pattern,
      ),
    ).toBeDefined();
    expect(result.patterns).toEqual(updateBlock.patterns);
  });

  it('should update the block trigger with a content payloadType payload', async () => {
    jest.spyOn(blockService, 'updateOne');
    const updateBlock: BlockUpdateDto = {
      patterns: [
        {
          label: 'Content label',
          value: 'Content value',
          type: PayloadType.content,
        },
      ],
    };
    const result = await blockController.updateOne(block.id, updateBlock);
    expect(blockService.updateOne).toHaveBeenCalledWith(block.id, updateBlock);

    expect(
      result.patterns.find(
        (pattern) =>
          typeof pattern === 'object' &&
          'type' in pattern &&
          pattern.type === PayloadType.content &&
          pattern,
      ),
    ).toBeDefined();
    expect(result.patterns).toEqual(updateBlock.patterns);
  });
});
