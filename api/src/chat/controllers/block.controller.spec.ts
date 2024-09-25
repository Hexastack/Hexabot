/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';

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
import { LoggerService } from '@/logger/logger.service';
import { PluginService } from '@/plugins/plugins.service';
import { SettingService } from '@/setting/services/setting.service';
import { PermissionRepository } from '@/user/repositories/permission.repository';
import { RoleRepository } from '@/user/repositories/role.repository';
import { UserRepository } from '@/user/repositories/user.repository';
import { PermissionModel } from '@/user/schemas/permission.schema';
import { RoleModel } from '@/user/schemas/role.schema';
import { UserModel } from '@/user/schemas/user.schema';
import { PermissionService } from '@/user/services/permission.service';
import { RoleService } from '@/user/services/role.service';
import { UserService } from '@/user/services/user.service';
import { IGNORED_TEST_FIELDS } from '@/utils/test/constants';
import {
  blockFixtures,
  installBlockFixtures,
} from '@/utils/test/fixtures/block';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { CategoryModel, Category } from './../schemas/category.schema';
import { BlockController } from './block.controller';
import { BlockCreateDto, BlockUpdateDto } from '../dto/block.dto';
import { BlockRepository } from '../repositories/block.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { LabelRepository } from '../repositories/label.repository';
import { BlockModel, Block } from '../schemas/block.schema';
import { LabelModel } from '../schemas/label.schema';
import { BlockService } from '../services/block.service';
import { CategoryService } from '../services/category.service';
import { LabelService } from '../services/label.service';

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
    const module = await Test.createTestingModule({
      controllers: [BlockController],
      imports: [
        rootMongooseTestModule(installBlockFixtures),
        MongooseModule.forFeature([
          BlockModel,
          LabelModel,
          CategoryModel,
          ContentModel,
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
        LoggerService,
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
    blockController = module.get<BlockController>(BlockController);
    blockService = module.get<BlockService>(BlockService);
    categoryService = module.get<CategoryService>(CategoryService);
    category = await categoryService.findOne({ label: 'default' });
    block = await blockService.findOne({ name: 'first' });
    blockToDelete = await blockService.findOne({ name: 'buttons' });
    hasNextBlocks = await blockService.findOne({
      name: 'hasNextBlocks',
    });
    hasPreviousBlocks = await blockService.findOne({
      name: 'hasPreviousBlocks',
    });
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

      expect(blockService.find).toHaveBeenCalledWith({});
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
      }));

      expect(blockService.findAndPopulate).toHaveBeenCalledWith({});
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
      });
    });

    it('should find one block by id, and populate its category and an empty previousBlocks', async () => {
      jest.spyOn(blockService, 'findOneAndPopulate');
      block = await blockService.findOne({ name: 'attachment' });
      const result = await blockController.findOne(
        block.id,
        FIELDS_TO_POPULATE,
      );
      expect(blockService.findOneAndPopulate).toHaveBeenCalledWith(block.id);
      expect(result).toEqualPayload({
        ...blockFixtures.find(({ name }) => name === 'attachment'),
        category,
        previousBlocks: [],
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
      ).rejects.toThrow(
        new NotFoundException(`Block with ID ${blockToDelete.id} not found`),
      );
    });
  });
});
