/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';

import { DummyRepository } from '@/utils/test/dummy/repositories/dummy.repository';
import { closeInMongodConnection } from '@/utils/test/test';

import { DummyModule } from '../test/dummy/dummy.module';
import { Dummy } from '../test/dummy/schemas/dummy.schema';

describe('BaseRepository', () => {
  let dummyModel: Model<Dummy>;
  let dummyRepository: DummyRepository;
  let createdId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DummyModule],
    }).compile();
    dummyModel = module.get<Model<Dummy>>(getModelToken(Dummy.name));
    dummyRepository = module.get<DummyRepository>(DummyRepository);
  });
  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);

  describe('create', () => {
    it('should create one dummy', async () => {
      jest.spyOn(dummyModel, 'create');
      const { id, ...rest } = await dummyRepository.create({
        dummy: 'dummy test 5',
      });
      createdId = id;

      expect(dummyModel.create).toHaveBeenCalledWith({
        dummy: 'dummy test 5',
      });
      expect(rest).toEqualPayload({
        dummy: 'dummy test 5',
      });
    });

    it('should create one dummy and invoke lifecycle hooks', async () => {
      const mockDto = { dummy: 'dummy test 5' };
      const spyBeforeCreate = jest
        .spyOn(dummyRepository, 'preCreate')
        .mockResolvedValue();
      const spyAfterCreate = jest
        .spyOn(dummyRepository, 'postCreate')
        .mockResolvedValue();

      await dummyRepository.create(mockDto);

      expect(spyBeforeCreate).toHaveBeenCalledWith(
        expect.objectContaining(mockDto),
      );
      expect(spyAfterCreate).toHaveBeenCalledWith(
        expect.objectContaining(mockDto),
      );
    });
  });

  describe('findOne', () => {
    it('should find by id and return one dummy data', async () => {
      jest.spyOn(dummyModel, 'findById');
      const result = await dummyRepository.findOne(createdId);

      expect(dummyModel.findById).toHaveBeenCalledWith(createdId, undefined);
      expect(result).toEqualPayload({
        dummy: 'dummy test 5',
      });
    });

    it('should find by criteria and return one dummy data', async () => {
      jest.spyOn(dummyModel, 'findOne');
      const result = await dummyRepository.findOne({ dummy: 'dummy test 5' });

      expect(dummyModel.findOne).toHaveBeenCalledWith(
        {
          dummy: 'dummy test 5',
        },
        undefined,
      );
      expect(result).toEqualPayload({
        dummy: 'dummy test 5',
      });
    });
  });

  describe('updateOne', () => {
    it('should updated by id and return one dummy data', async () => {
      jest.spyOn(dummyModel, 'findOneAndUpdate');
      const result = await dummyRepository.updateOne(createdId, {
        dummy: 'updated dummy text',
      });

      expect(dummyModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: createdId },
        {
          $set: { dummy: 'updated dummy text' },
        },
        {
          new: true,
        },
      );
      expect(result).toEqualPayload({
        dummy: 'updated dummy text',
      });
    });

    it('should updated by criteria and return one dummy data', async () => {
      jest.spyOn(dummyModel, 'findOneAndUpdate');
      const result = await dummyRepository.updateOne(
        { dummy: 'updated dummy text' },
        {
          dummy: 'updated dummy text 2',
        },
      );

      expect(dummyModel.findOneAndUpdate).toHaveBeenCalledWith(
        { dummy: 'updated dummy text' },
        {
          $set: { dummy: 'updated dummy text 2' },
        },
        {
          new: true,
        },
      );
      expect(result).toEqualPayload({
        dummy: 'updated dummy text 2',
      });
    });

    it('should update by id and invoke lifecycle hooks', async () => {
      const created = await dummyRepository.create({ dummy: 'initial text' });
      const mockUpdate = { dummy: 'updated dummy text' };
      const spyBeforeUpdate = jest
        .spyOn(dummyRepository, 'preUpdate')
        .mockResolvedValue();
      const spyAfterUpdate = jest
        .spyOn(dummyRepository, 'postUpdate')
        .mockResolvedValue();

      await dummyRepository.updateOne(created.id, mockUpdate);

      expect(spyBeforeUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ $useProjection: true }),
        {
          _id: new Types.ObjectId(created.id),
        },
        expect.objectContaining({ $set: expect.objectContaining(mockUpdate) }),
      );
      expect(spyAfterUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ $useProjection: true }),
        expect.objectContaining({ dummy: 'updated dummy text' }),
      );
    });
  });

  describe('deleteOne', () => {
    it('should delete by id one dummy data', async () => {
      jest.spyOn(dummyModel, 'deleteOne');
      const result = await dummyRepository.deleteOne(createdId);

      expect(dummyModel.deleteOne).toHaveBeenCalledWith({
        _id: createdId,
      });
      expect(result).toEqualPayload({ acknowledged: true, deletedCount: 1 });
    });

    it('should delete by criteria one dummy data', async () => {
      jest.spyOn(dummyModel, 'deleteOne');
      const result = await dummyRepository.deleteOne({
        dummy: 'dummy test 2',
      });

      expect(dummyModel.deleteOne).toHaveBeenCalledWith({
        dummy: 'dummy test 2',
      });
      expect(result).toEqualPayload({ acknowledged: true, deletedCount: 1 });
    });

    it('should call lifecycle hooks appropriately when deleting by id', async () => {
      const criteria = createdId;

      // Spies for lifecycle hooks
      const spyBeforeDelete = jest
        .spyOn(dummyRepository, 'preDelete')
        .mockResolvedValue();
      const spyAfterDelete = jest
        .spyOn(dummyRepository, 'postDelete')
        .mockResolvedValue();

      await dummyRepository.deleteOne(criteria);

      // Verifying that lifecycle hooks are called with correct parameters
      expect(spyBeforeDelete).toHaveBeenCalledTimes(1);
      expect(spyBeforeDelete).toHaveBeenCalledWith(
        expect.objectContaining({ $useProjection: true }),
        {
          _id: new Types.ObjectId(createdId),
        },
      );
      expect(spyAfterDelete).toHaveBeenCalledWith(
        expect.objectContaining({ $useProjection: true }),
        { acknowledged: true, deletedCount: 0 },
      );
    });
  });
});
