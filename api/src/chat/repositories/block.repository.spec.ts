/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Model } from 'mongoose';

import {
  blockFixtures,
  installBlockFixtures,
} from '@/utils/test/fixtures/block';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { BlockModel, Block } from '../schemas/block.schema';
import { CategoryModel, Category } from '../schemas/category.schema';
import { LabelModel } from '../schemas/label.schema';

import { BlockRepository } from './block.repository';
import { CategoryRepository } from './category.repository';

describe('BlockRepository', () => {
  let blockRepository: BlockRepository;
  let categoryRepository: CategoryRepository;
  let blockModel: Model<Block>;
  let category: Category;
  let hasPreviousBlocks: Block;
  let hasNextBlocks: Block;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installBlockFixtures),
        MongooseModule.forFeature([BlockModel, CategoryModel, LabelModel]),
      ],
      providers: [BlockRepository, CategoryRepository, EventEmitter2],
    }).compile();
    blockRepository = module.get<BlockRepository>(BlockRepository);
    categoryRepository = module.get<CategoryRepository>(CategoryRepository);
    blockModel = module.get<Model<Block>>(getModelToken('Block'));
    category = await categoryRepository.findOne({ label: 'default' });
    hasPreviousBlocks = await blockRepository.findOne({
      name: 'hasPreviousBlocks',
    });
    hasNextBlocks = await blockRepository.findOne({
      name: 'hasNextBlocks',
    });
  });

  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);

  describe('findOneAndPopulate', () => {
    it('should find one block by id, and populate its  trigger_labels, assign_labels, nextBlocks, attachedBlock, category,previousBlocks', async () => {
      jest.spyOn(blockModel, 'findById');

      const result = await blockRepository.findOneAndPopulate(hasNextBlocks.id);
      expect(blockModel.findById).toHaveBeenCalledWith(hasNextBlocks.id);
      expect(result).toEqualPayload({
        ...blockFixtures.find(({ name }) => name === hasNextBlocks.name),
        category,
        nextBlocks: [hasPreviousBlocks],
        previousBlocks: [],
      });
    });
  });

  describe('findAndPopulate', () => {
    it('should find blocks, and foreach block populate its  trigger_labels, assign_labels, attachedBlock, category, previousBlocks', async () => {
      jest.spyOn(blockModel, 'find');
      const category = await categoryRepository.findOne({ label: 'default' });
      const result = await blockRepository.findAndPopulate({});
      const blocksWithCategory = blockFixtures.map((blockFixture) => ({
        ...blockFixture,
        category,
        previousBlocks:
          blockFixture.name === 'hasPreviousBlocks' ? [hasNextBlocks] : [],
        nextBlocks:
          blockFixture.name === 'hasNextBlocks' ? [hasPreviousBlocks] : [],
      }));

      expect(blockModel.find).toHaveBeenCalledWith({});
      expect(result).toEqualPayload(blocksWithCategory);
    });

    it('should find blocks, and foreach block populate its  trigger_labels, assign_labels, nextBlocks, attachedBlock, category', async () => {
      jest.spyOn(blockModel, 'find');
      const category = await categoryRepository.findOne({ label: 'default' });
      const result = await blockRepository.findAndPopulate({});
      const blocksWithCategory = blockFixtures.map((blockFixture) => ({
        ...blockFixture,
        category,
        previousBlocks:
          blockFixture.name === 'hasPreviousBlocks' ? [hasNextBlocks] : [],
        nextBlocks:
          blockFixture.name === 'hasNextBlocks' ? [hasPreviousBlocks] : [],
      }));

      expect(blockModel.find).toHaveBeenCalledWith({});
      expect(result).toEqualPayload(blocksWithCategory);
    });
  });
});
