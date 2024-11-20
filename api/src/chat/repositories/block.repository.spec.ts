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
import mongoose, { Model } from 'mongoose';

import {
  blockFixtures,
  installBlockFixtures,
} from '@/utils/test/fixtures/block';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

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
  let objCategory: mongoose.Types.ObjectId;

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
    validIds = ['64abc1234def567890fedcba', '64abc1234def567890fedcbc'];
    validCategory = '64def5678abc123490fedcba';
    objCategory = new mongoose.Types.ObjectId('64def5678abc123490fedcba');

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

  describe('preUpdate', () => {
    it('should update blocks referencing the moved block when category is updated with valid criteria', async () => {
      const mockUpdateMany = jest.spyOn(blockModel, 'updateMany');

      const criteria = { _id: hasPreviousBlocks.id };
      const updates = { $set: { category: 'newCategory' } };
      const mockQuery = {} as any;

      await blockRepository.preUpdate(mockQuery, criteria, updates);

      expect(mockUpdateMany).toHaveBeenNthCalledWith(
        1,
        { nextBlocks: hasPreviousBlocks.id },
        { $pull: { nextBlocks: hasPreviousBlocks.id } },
      );

      expect(mockUpdateMany).toHaveBeenNthCalledWith(
        2,
        { attachedBlock: hasPreviousBlocks.id },
        { $set: { attachedBlock: null } },
      );
    });

    it('should throw an error if category is updated without a valid _id in criteria', async () => {
      const updates = { $set: { category: 'newCategory' } };
      const mockQuery = {} as any;

      await expect(
        blockRepository.preUpdate(mockQuery, {}, updates),
      ).rejects.toThrowError(
        'Criteria must include a valid id to update category.',
      );
    });

    it('should call checkDeprecatedAttachmentUrl with the correct update object', async () => {
      const mockCheckDeprecatedAttachmentUrl = jest.spyOn(
        blockRepository,
        'checkDeprecatedAttachmentUrl',
      );

      const criteria = { _id: hasPreviousBlocks.id };
      const updates = {
        $set: { category: 'newCategory', attachedBlock: 'someUrl' },
      };
      const mockQuery = {} as any;

      await blockRepository.preUpdate(mockQuery, criteria, updates);

      expect(mockCheckDeprecatedAttachmentUrl).toHaveBeenCalledWith(
        updates.$set,
      );
    });

    it('should not call updateMany if no category update is provided', async () => {
      const mockUpdateMany = jest.spyOn(blockModel, 'updateMany');

      const criteria = { _id: hasPreviousBlocks.id };
      const updates = { $set: { name: 'newName' } };
      const mockQuery = {} as any;

      await blockRepository.preUpdate(mockQuery, criteria, updates);

      expect(mockUpdateMany).not.toHaveBeenCalled();
    });
  });

  describe('mapIdsAndCategory', () => {
    it('should map string IDs and category to Mongoose ObjectIDs', async () => {
      const result = blockRepository.mapIdsAndCategory(validIds, validCategory);

      expect(result.objIds).toHaveLength(validIds.length);
      validIds.forEach((id, index) => {
        expect(result.objIds[index].toHexString()).toBe(id);
      });
      expect(result.objCategory.toHexString()).toBe(validCategory);
    });

    it('should throw an error if invalid IDs or category are provided', () => {
      const ids = ['invalidId', '64xyz6789abc1234567defca'];
      const category = 'invalidCategory';

      expect(() =>
        blockRepository.mapIdsAndCategory(ids, category),
      ).toThrowError(
        'input must be a 24 character hex string, 12 byte Uint8Array, or an integer',
      );
    });
  });

  describe('updateBlocksInScope', () => {
    it('should update blocks within the scope', async () => {
      const mockFindOne = jest.spyOn(blockModel, 'findOne').mockResolvedValue({
        _id: validIds[0],
        category: new mongoose.Types.ObjectId('64abc1234def567890fedcbc'),
        nextBlocks: [new mongoose.Types.ObjectId(validIds[1])],
        attachedBlock: new mongoose.Types.ObjectId(validIds[1]),
      });

      const mockUpdateOne = jest.spyOn(blockModel, 'updateOne');

      await blockRepository.updateBlocksInScope(objCategory, validIds);

      expect(mockFindOne).toHaveBeenCalledWith({
        _id: new mongoose.Types.ObjectId(validIds[0]),
      });
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: new mongoose.Types.ObjectId(validIds[0]) },
        {
          nextBlocks: [new mongoose.Types.ObjectId(validIds[1])],
          attachedBlock: new mongoose.Types.ObjectId(validIds[1]),
        },
      );
    });

    it('should not update blocks if category matches', async () => {
      jest.spyOn(blockModel, 'findOne').mockResolvedValue({
        _id: validIds[0],
        category: objCategory,
        nextBlocks: [],
        attachedBlock: null,
      });

      const mockUpdateOne = jest.spyOn(blockModel, 'updateOne');

      await blockRepository.updateBlocksInScope(objCategory, validIds);

      expect(mockUpdateOne).not.toHaveBeenCalled();
    });
  });

  describe('updateExternalBlocks', () => {
    let validIds: string[];

    beforeAll(() => {
      validIds = ['64abc1234def567890fedcba', '64def5678abc123490fedcbc'];
    });

    it('should update external blocks with attachedBlock or nextBlocks', async () => {
      const otherBlocks = [
        {
          id: new mongoose.Types.ObjectId('64abc1234def567890fedcba'),
          attachedBlock: new mongoose.Types.ObjectId(validIds[0]),
          nextBlocks: [new mongoose.Types.ObjectId(validIds[0])],
        },
      ];
      const mockUpdateOne = jest.spyOn(blockModel, 'updateOne');

      await blockRepository.updateExternalBlocks(otherBlocks, [
        new mongoose.Types.ObjectId(validIds[0]),
      ]);

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: otherBlocks[0].id },
        { attachedBlock: null },
      );

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: otherBlocks[0].id },
        { nextBlocks: [] },
      );
    });

    it('should not update if no changes are necessary', async () => {
      const otherBlocks = [
        {
          id: new mongoose.Types.ObjectId('64abc1234def567890fedcba'),
          attachedBlock: null,
          nextBlocks: [],
        },
      ];
      const mockUpdateOne = jest.spyOn(blockModel, 'updateOne');

      await blockRepository.updateExternalBlocks(otherBlocks, [
        new mongoose.Types.ObjectId(validIds[0]),
      ]);

      expect(mockUpdateOne).not.toHaveBeenCalled();
    });
  });

  describe('preUpdateMany', () => {
    let validIds: string[];
    let objCategory: mongoose.Types.ObjectId;

    beforeAll(() => {
      validIds = ['64abc1234def567890fedcba', '64def5678abc123490fedcbc'];
      objCategory = new mongoose.Types.ObjectId('64def5678abc123490fedcbc');
    });

    it('should map IDs, find other blocks, and update blocks in scope and external blocks', async () => {
      const mockMapIdsAndCategory = jest
        .spyOn(blockRepository, 'mapIdsAndCategory')
        .mockReturnValue({
          objIds: validIds.map((id) => new mongoose.Types.ObjectId(id)),
          objCategory,
        });

      const mockFind = jest.spyOn(blockModel, 'find').mockResolvedValue([
        {
          id: new mongoose.Types.ObjectId('64abc1234def567890fedcba'),
          attachedBlock: new mongoose.Types.ObjectId(validIds[0]),
          nextBlocks: [new mongoose.Types.ObjectId(validIds[0])],
        },
      ]);

      const mockUpdateBlocksInScope = jest
        .spyOn(blockRepository, 'updateBlocksInScope')
        .mockResolvedValue(undefined);

      const mockUpdateExternalBlocks = jest
        .spyOn(blockRepository, 'updateExternalBlocks')
        .mockResolvedValue(undefined);

      await blockRepository.preUpdateMany(
        {} as any,
        { _id: { $in: validIds } },
        { $set: { category: objCategory.toHexString() } },
      );

      expect(mockMapIdsAndCategory).toHaveBeenCalledWith(
        validIds,
        objCategory.toHexString(),
      );

      expect(mockFind).toHaveBeenCalledWith({
        _id: { $nin: validIds.map((id) => new mongoose.Types.ObjectId(id)) },
        category: { $ne: objCategory },
        $or: [
          {
            attachedBlock: {
              $in: validIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
          },
          {
            nextBlocks: {
              $in: validIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
          },
        ],
      });

      expect(mockUpdateBlocksInScope).toHaveBeenCalledWith(
        objCategory,
        validIds,
      );

      expect(mockUpdateExternalBlocks).toHaveBeenCalledWith(
        [
          {
            id: new mongoose.Types.ObjectId('64abc1234def567890fedcba'),
            attachedBlock: new mongoose.Types.ObjectId(validIds[0]),
            nextBlocks: [new mongoose.Types.ObjectId(validIds[0])],
          },
        ],
        validIds.map((id) => new mongoose.Types.ObjectId(id)),
      );
    });

    it('should not perform updates if criteria or updates are missing', async () => {
      const mockMapIdsAndCategory = jest.spyOn(
        blockRepository,
        'mapIdsAndCategory',
      );
      const mockFind = jest.spyOn(blockModel, 'find');
      const mockUpdateBlocksInScope = jest.spyOn(
        blockRepository,
        'updateBlocksInScope',
      );
      const mockUpdateExternalBlocks = jest.spyOn(
        blockRepository,
        'updateExternalBlocks',
      );

      await blockRepository.preUpdateMany({} as any, {}, {});

      expect(mockMapIdsAndCategory).not.toHaveBeenCalled();
      expect(mockFind).not.toHaveBeenCalled();
      expect(mockUpdateBlocksInScope).not.toHaveBeenCalled();
      expect(mockUpdateExternalBlocks).not.toHaveBeenCalled();
    });
  });
});
