/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { I18nService } from '@/i18n/services/i18n.service';
import {
  blockFixtures,
  installBlockFixtures,
} from '@/utils/test/fixtures/block';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { Block } from '../schemas/block.schema';
import { Category } from '../schemas/category.schema';

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
      models: ['LabelModel'],
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installBlockFixtures)],
      providers: [
        BlockRepository,
        CategoryRepository,
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
      ],
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
      jest.spyOn(blockRepository, 'find').mockResolvedValue([
        {
          id: blockValidIds[0],
          category: category.id,
          nextBlocks: [blockValidIds[1]],
          attachedBlock: blockValidIds[2],
        },
      ] as Block[]);
      jest.spyOn(blockRepository, 'updateOne');

      await blockRepository.prepareBlocksInCategoryUpdateScope(
        validCategory,
        blockValidIds,
      );

      expect(blockRepository.updateOne).toHaveBeenCalledWith(blockValidIds[0], {
        nextBlocks: [blockValidIds[1]],
        attachedBlock: blockValidIds[2],
      });
    });

    it('should not update blocks if the category already matches', async () => {
      jest.spyOn(blockRepository, 'find').mockResolvedValue([]);
      jest.spyOn(blockRepository, 'updateOne');

      await blockRepository.prepareBlocksInCategoryUpdateScope(
        category.id,
        blockValidIds,
      );

      expect(blockRepository.find).toHaveBeenCalled();
      expect(blockRepository.updateOne).not.toHaveBeenCalled();
    });

    it('should handle circular references within moved blocks', async () => {
      const blockA = {
        id: 'blockA',
        nextBlocks: ['blockB'],
        attachedBlock: null,
      } as Block;
      const blockB = {
        id: 'blockB',
        nextBlocks: ['blockA'],
        attachedBlock: null,
      } as Block;
      const movedBlocks = [blockA, blockB];
      const movedBlockIds = movedBlocks.map((b) => b.id);

      jest.spyOn(blockRepository, 'find').mockResolvedValue(movedBlocks);
      const mockUpdateOne = jest
        .spyOn(blockRepository, 'updateOne')
        .mockResolvedValue({} as any);

      await blockRepository.prepareBlocksInCategoryUpdateScope(
        'new-category',
        movedBlockIds,
      );

      expect(mockUpdateOne).toHaveBeenCalledWith('blockA', {
        nextBlocks: ['blockB'],
        attachedBlock: null,
      });

      expect(mockUpdateOne).toHaveBeenCalledWith('blockB', {
        nextBlocks: ['blockA'],
        attachedBlock: null,
      });

      expect(mockUpdateOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('prepareBlocksOutOfCategoryUpdateScope', () => {
    it('should update blocks outside the scope by removing references from attachedBlock', async () => {
      const otherBlocks = [
        {
          id: blockValidIds[1],
          attachedBlock: blockValidIds[0],
          nextBlocks: [],
        },
      ] as unknown as Block[];

      const mockUpdateOne = jest.spyOn(blockRepository, 'updateOne');

      await blockRepository.prepareBlocksOutOfCategoryUpdateScope(otherBlocks, [
        blockValidIds[0],
      ]);

      expect(mockUpdateOne).toHaveBeenCalledWith(blockValidIds[1], {
        attachedBlock: null,
      });
    });

    it('should update blocks outside the scope by removing references from nextBlocks', async () => {
      const otherBlocks = [
        {
          id: blockValidIds[1],
          attachedBlock: null,
          nextBlocks: [blockValidIds[0], blockValidIds[2]],
        },
      ] as unknown as Block[];

      const mockUpdateOne = jest.spyOn(blockRepository, 'updateOne');

      await blockRepository.prepareBlocksOutOfCategoryUpdateScope(otherBlocks, [
        blockValidIds[0],
      ]);

      expect(mockUpdateOne).toHaveBeenCalledWith(blockValidIds[1], {
        nextBlocks: [blockValidIds[2]],
      });
    });

    it('should not update blocks if their references are not in the moved ids', async () => {
      const otherBlocks = [
        {
          id: blockValidIds[1],
          attachedBlock: 'some-other-id',
          nextBlocks: [],
        },
        {
          id: blockValidIds[2],
          attachedBlock: null,
          nextBlocks: ['some-other-id-2'],
        },
      ] as Block[];
      const mockUpdateOne = jest.spyOn(blockRepository, 'updateOne');

      await blockRepository.prepareBlocksOutOfCategoryUpdateScope(otherBlocks, [
        blockValidIds[0],
      ]);

      expect(mockUpdateOne).not.toHaveBeenCalled();
    });

    it('should correctly update multiple out-of-scope blocks referencing the same moved block', async () => {
      const movedBlockId = blockValidIds[0];
      const otherBlocks = [
        {
          id: 'block-with-attached',
          attachedBlock: movedBlockId,
          nextBlocks: [],
        },
        {
          id: 'block-with-next',
          attachedBlock: null,
          nextBlocks: [movedBlockId, blockValidIds[2]],
        },
      ] as unknown as Block[];

      const mockUpdateOne = jest.spyOn(blockRepository, 'updateOne');

      await blockRepository.prepareBlocksOutOfCategoryUpdateScope(otherBlocks, [
        movedBlockId,
      ]);

      expect(mockUpdateOne).toHaveBeenCalledWith('block-with-attached', {
        attachedBlock: null,
      });
      expect(mockUpdateOne).toHaveBeenCalledWith('block-with-next', {
        nextBlocks: [blockValidIds[2]],
      });
      expect(mockUpdateOne).toHaveBeenCalledTimes(2);
    });

    it('should not update references for blocks that are themselves in the moved blocks list', async () => {
      const movedBlockId = blockValidIds[0];
      const movedBlock = {
        id: movedBlockId,
        attachedBlock: null,
        nextBlocks: [movedBlockId, blockValidIds[2]],
      } as unknown as Block;
      const otherBlocks = [movedBlock];

      const mockUpdateOne = jest.spyOn(blockRepository, 'updateOne');

      // The movedBlock is both referencing and is itself a moved block, so should not be updated
      await blockRepository.prepareBlocksOutOfCategoryUpdateScope(otherBlocks, [
        movedBlockId,
      ]);

      expect(mockUpdateOne).not.toHaveBeenCalled();
    });
  });

  describe('preUpdateMany', () => {
    it('should update blocks in and out of the scope', async () => {
      const movedBlocks = [
        { id: validIds[0], category: 'old_category_id' },
        { id: validIds[1], category: 'old_category_id' },
      ] as Block[];
      const otherBlocks = [
        {
          id: 'other-block-1',
          attachedBlock: validIds[0],
          nextBlocks: [],
        },
      ] as unknown as Block[];

      const mockFind = jest
        .spyOn(blockRepository, 'find')
        .mockResolvedValueOnce(movedBlocks)
        .mockResolvedValueOnce(otherBlocks);

      const prepareBlocksInCategoryUpdateScope = jest
        .spyOn(blockRepository, 'prepareBlocksInCategoryUpdateScope')
        .mockResolvedValue(undefined);
      const prepareBlocksOutOfCategoryUpdateScope = jest
        .spyOn(blockRepository, 'prepareBlocksOutOfCategoryUpdateScope')
        .mockResolvedValue(undefined);

      await blockRepository.preUpdateMany(
        {} as any,
        { _id: { $in: validIds } },
        { $set: { category: validCategory } },
      );

      const objectIds = validIds.map((id) => new Types.ObjectId(id));

      expect(mockFind).toHaveBeenCalledTimes(2);
      expect(mockFind).toHaveBeenNthCalledWith(1, {
        _id: { $in: validIds },
      });
      expect(mockFind).toHaveBeenNthCalledWith(2, {
        _id: { $nin: objectIds },
        category: movedBlocks[0].category,
        $or: [
          { attachedBlock: { $in: objectIds } },
          { nextBlocks: { $in: objectIds } },
        ],
      });
      expect(prepareBlocksInCategoryUpdateScope).toHaveBeenCalledWith(
        validCategory,
        validIds,
      );
      expect(prepareBlocksOutOfCategoryUpdateScope).toHaveBeenCalledWith(
        otherBlocks,
        validIds,
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

  describe('search', () => {
    it('should return empty array when query is empty', async () => {
      const blockModelFindSpy = jest.spyOn(blockRepository['model'], 'find');

      const result = await blockRepository.search('', 10);
      // Early return with empty query
      expect(result).toEqual([]);
      // Ensure no database query was made
      expect(blockModelFindSpy).not.toHaveBeenCalled();
    });

    it('should find blocks by name with exact phrase match', async () => {
      const result = await blockRepository.search('hasNextBlocks', 10);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.find((r) => r.name === 'hasNextBlocks')).toBeDefined();
    });

    it('should find blocks based on message content', async () => {
      const result = await blockRepository.search('Hi back', 10);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.find((r) => r.name === 'hasNextBlocks')).toBeDefined();
    });

    it('should filter by category when provided', async () => {
      const result = await blockRepository.search(
        'hasNextBlocks',
        10,
        category.id,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((r) => {
        expect(r.category?.toString()).toBe(category.id);
      });
    });

    it('should ignore invalid category ObjectId', async () => {
      const result = await blockRepository.search(
        'hasNextBlocks',
        10,
        'invalid-id',
      );
      expect(result.length).toBeGreaterThan(0); // Should still find blocks
    });

    it('should limit results correctly', async () => {
      const result = await blockRepository.search('Hi', 1);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(1);
    });

    it('should return results with search scores', async () => {
      const result = await blockRepository.search('hasNextBlocks', 10);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((r) => {
        expect(r).toHaveProperty('score');
        expect(typeof r.score).toBe('number');
        expect(r.score).toBeGreaterThan(0);
      });
    });

    it('should sort results by score in descending order', async () => {
      const result = await blockRepository.search('Hi', 10);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
      }
    });
  });
});
