/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  blockFixtures,
  installBlockFixtures,
} from '@/utils/test/fixtures/block';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { Block, BlockModel } from '../schemas/block.schema';
import { Category, CategoryModel } from '../schemas/category.schema';
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
  let validIds: string[];
  let validCategory: string;
  let blockValidIds: string[];

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      imports: [
        rootMongooseTestModule(installBlockFixtures),
        MongooseModule.forFeature([BlockModel, CategoryModel, LabelModel]),
      ],
      providers: [BlockRepository, CategoryRepository],
    });
    [blockRepository, categoryRepository, blockModel] = await getMocks([
      BlockRepository,
      CategoryRepository,
      getModelToken(Block.name),
    ]);
    validIds = ['64abc1234def567890fedcba', '64abc1234def567890fedcbc'];
    validCategory = '64def5678abc123490fedcba';

    category = (await categoryRepository.findOne({ label: 'default' }))!;
    hasPreviousBlocks = (await blockRepository.findOne({
      name: 'hasPreviousBlocks',
    }))!;
    hasNextBlocks = (await blockRepository.findOne({
      name: 'hasNextBlocks',
    }))!;
    blockValidIds = (await blockRepository.findAll()).map(({ id }) => id);
  });

  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);

  describe('findOneAndPopulate', () => {
    it('should find one block by id, and populate its  trigger_labels, assign_labels, nextBlocks, attachedBlock, category,previousBlocks', async () => {
      jest.spyOn(blockModel, 'findById');

      const result = await blockRepository.findOneAndPopulate(hasNextBlocks.id);
      expect(blockModel.findById).toHaveBeenCalledWith(
        hasNextBlocks.id,
        undefined,
      );
      expect(result).toEqualPayload({
        ...blockFixtures.find(({ name }) => name === hasNextBlocks.name),
        category,
        nextBlocks: [hasPreviousBlocks],
        previousBlocks: [],
        attachedToBlock: null,
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
        attachedToBlock: null,
      }));

      expect(blockModel.find).toHaveBeenCalledWith({}, undefined);
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
        attachedToBlock: null,
      }));

      expect(blockModel.find).toHaveBeenCalledWith({}, undefined);
      expect(result).toEqualPayload(blocksWithCategory);
    });
  });

  describe('preUpdate', () => {
    it('should remove references to a moved block when updating category', async () => {
      const mockUpdateMany = jest.spyOn(blockRepository, 'updateMany');
      const criteria = { _id: validIds[0] };
      const updates = { $set: { category: validCategory } };

      const mockFindOne = jest
        .spyOn(blockRepository, 'findOne')
        .mockResolvedValue({
          id: validIds[0],
          category: 'oldCategory',
        } as Block);

      await blockRepository.preUpdate({} as any, criteria, updates);

      expect(mockFindOne).toHaveBeenCalledWith(criteria);
      expect(mockUpdateMany).toHaveBeenCalledTimes(2);
      expect(mockUpdateMany).toHaveBeenNthCalledWith(
        1,
        { nextBlocks: validIds[0] },
        { $pull: { nextBlocks: validIds[0] } },
      );
      expect(mockUpdateMany).toHaveBeenNthCalledWith(
        2,
        { attachedBlock: validIds[0] },
        { $set: { attachedBlock: null } },
      );
    });

    it('should do nothing if no block is found for the criteria', async () => {
      const mockFindOne = jest
        .spyOn(blockRepository, 'findOne')
        .mockResolvedValue(null);
      const mockUpdateMany = jest.spyOn(blockRepository, 'updateMany');

      await blockRepository.preUpdate(
        {} as any,
        { _id: 'nonexistent' },
        { $set: { category: 'newCategory' } },
      );

      expect(mockFindOne).toHaveBeenCalledWith({ _id: 'nonexistent' });
      expect(mockUpdateMany).not.toHaveBeenCalled();
    });
  });

  describe('prepareBlocksInCategoryUpdateScope', () => {
    it('should update blocks within the scope based on category and ids', async () => {
      jest.spyOn(blockRepository, 'findOne').mockResolvedValue({
        id: blockValidIds[0],
        category: 'oldCategory',
        nextBlocks: [blockValidIds[1]],
        attachedBlock: blockValidIds[1],
      } as Block);

      const mockUpdateOne = jest.spyOn(blockRepository, 'updateOne');

      await blockRepository.prepareBlocksInCategoryUpdateScope(
        validCategory,
        blockValidIds,
      );

      expect(mockUpdateOne).toHaveBeenCalledWith(blockValidIds[0], {
        nextBlocks: [blockValidIds[1]],
        attachedBlock: blockValidIds[1],
      });
    });

    it('should not update blocks if the category already matches', async () => {
      jest.spyOn(blockRepository, 'findOne').mockResolvedValue({
        id: validIds[0],
        category: validCategory,
        nextBlocks: [],
        attachedBlock: null,
      } as unknown as Block);

      const mockUpdateOne = jest.spyOn(blockRepository, 'updateOne');

      await blockRepository.prepareBlocksInCategoryUpdateScope(
        validCategory,
        validIds,
      );

      expect(mockUpdateOne).not.toHaveBeenCalled();
    });
  });

  describe('prepareBlocksOutOfCategoryUpdateScope', () => {
    it('should update blocks outside the scope by removing references from attachedBlock', async () => {
      const otherBlocks = [
        {
          id: blockValidIds[1],
          attachedBlock: blockValidIds[0],
          nextBlocks: [blockValidIds[0]],
        },
      ] as Block[];

      const mockUpdateOne = jest.spyOn(blockRepository, 'updateOne');

      await blockRepository.prepareBlocksOutOfCategoryUpdateScope(
        otherBlocks,
        blockValidIds,
      );

      expect(mockUpdateOne).toHaveBeenCalledWith(blockValidIds[1], {
        attachedBlock: null,
      });
    });

    it('should update blocks outside the scope by removing references from nextBlocks', async () => {
      const otherBlocks = [
        {
          id: blockValidIds[1],
          attachedBlock: null,
          nextBlocks: [blockValidIds[0], blockValidIds[1]],
        },
      ] as unknown as Block[];

      const mockUpdateOne = jest.spyOn(blockRepository, 'updateOne');

      await blockRepository.prepareBlocksOutOfCategoryUpdateScope(otherBlocks, [
        blockValidIds[0],
      ]);

      expect(mockUpdateOne).toHaveBeenCalledWith(blockValidIds[1], {
        nextBlocks: [blockValidIds[1]],
      });
    });
  });

  describe('preUpdateMany', () => {
    it('should update blocks in and out of the scope', async () => {
      const mockFind = jest.spyOn(blockRepository, 'find').mockResolvedValue([
        {
          id: blockValidIds[1],
          attachedBlock: validIds[0],
          nextBlocks: [validIds[0]],
        },
      ] as Block[]);

      const prepareBlocksInCategoryUpdateScope = jest.spyOn(
        blockRepository,
        'prepareBlocksInCategoryUpdateScope',
      );
      const prepareBlocksOutOfCategoryUpdateScope = jest.spyOn(
        blockRepository,
        'prepareBlocksOutOfCategoryUpdateScope',
      );

      await blockRepository.preUpdateMany(
        {} as any,
        { _id: { $in: validIds } },
        { $set: { category: validCategory } },
      );

      expect(mockFind).toHaveBeenCalled();
      expect(prepareBlocksInCategoryUpdateScope).toHaveBeenCalledWith(
        validCategory,
        [blockValidIds[1]],
      );
      expect(prepareBlocksOutOfCategoryUpdateScope).toHaveBeenCalledWith(
        [
          {
            id: blockValidIds[1],
            attachedBlock: validIds[0],
            nextBlocks: [validIds[0]],
          },
        ],
        [blockValidIds[1]],
      );
    });

    it('should not perform updates if no category is provided', async () => {
      const mockFind = jest.spyOn(blockRepository, 'find');
      const prepareBlocksInCategoryUpdateScope = jest.spyOn(
        blockRepository,
        'prepareBlocksInCategoryUpdateScope',
      );
      const prepareBlocksOutOfCategoryUpdateScope = jest.spyOn(
        blockRepository,
        'prepareBlocksOutOfCategoryUpdateScope',
      );

      await blockRepository.preUpdateMany({} as any, {}, { $set: {} });

      expect(mockFind).not.toHaveBeenCalled();
      expect(prepareBlocksInCategoryUpdateScope).not.toHaveBeenCalled();
      expect(prepareBlocksOutOfCategoryUpdateScope).not.toHaveBeenCalled();
    });
  });
});
