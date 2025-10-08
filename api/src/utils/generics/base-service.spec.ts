/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { DummyService } from '@/utils/test/dummy/services/dummy.service';
import { closeInMongodConnection } from '@/utils/test/test';

import { DummyModule } from '../test/dummy/dummy.module';
import { DummyRepository } from '../test/dummy/repositories/dummy.repository';
import { buildTestingMocks } from '../test/utils';

describe('BaseService', () => {
  let dummyRepository: DummyRepository;
  let dummyService: DummyService;
  let createdId: string;
  const createdPayload = {
    dummy: 'dummy test 5',
  };
  const updatedPayload = { dummy: 'updated dummy text' };
  const updatedCriteriaPayload = {
    dummy: 'updated dummy text 2',
  };
  const deletedCriteriaPayload = {
    dummy: 'dummy test 2',
  };

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      imports: [DummyModule],
    });
    [dummyRepository, dummyService] = await getMocks([
      DummyRepository,
      DummyService,
    ]);
  });
  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);

  describe('create', () => {
    it('should create one dummy', async () => {
      jest.spyOn(dummyRepository, 'create');
      const { id, ...rest } = await dummyService.create(createdPayload);
      createdId = id;

      expect(dummyRepository.create).toHaveBeenCalledWith(createdPayload);
      expect(rest).toEqualPayload(createdPayload);
    });
  });

  describe('findOne', () => {
    it('should find by id and return one dummy data', async () => {
      jest.spyOn(dummyRepository, 'findOne');
      const result = await dummyService.findOne(createdId);

      expect(dummyRepository.findOne).toHaveBeenCalledWith(
        createdId,
        undefined,
        undefined,
      );
      expect(result).toEqualPayload(createdPayload);
    });

    it('should find by criteria and return one dummy data', async () => {
      jest.spyOn(dummyRepository, 'findOne');
      const result = await dummyService.findOne(createdPayload);

      expect(dummyRepository.findOne).toHaveBeenCalledWith(
        createdPayload,
        undefined,
        undefined,
      );
      expect(result).toEqualPayload(createdPayload);
    });
  });

  describe('updateOne', () => {
    it('should updated by id and return one dummy data', async () => {
      jest.spyOn(dummyRepository, 'updateOne');
      const result = await dummyService.updateOne(createdId, updatedPayload);

      expect(dummyRepository.updateOne).toHaveBeenCalledWith(
        createdId,
        updatedPayload,
        undefined,
      );
      expect(result).toEqualPayload(updatedPayload);
    });

    it('should updated by criteria and return one dummy data', async () => {
      jest.spyOn(dummyRepository, 'updateOne');
      const result = await dummyService.updateOne(
        updatedPayload,
        updatedCriteriaPayload,
      );

      expect(dummyRepository.updateOne).toHaveBeenCalledWith(
        updatedPayload,
        updatedCriteriaPayload,
        undefined,
      );
      expect(result).toEqualPayload(updatedCriteriaPayload);
    });
  });

  describe('deleteOne', () => {
    it('should delete by id one dummy data', async () => {
      jest.spyOn(dummyRepository, 'deleteOne');
      const result = await dummyService.deleteOne(createdId);

      expect(dummyRepository.deleteOne).toHaveBeenCalledWith(createdId);
      expect(result).toEqualPayload({ acknowledged: true, deletedCount: 1 });
    });

    it('should delete by id one dummy data', async () => {
      jest.spyOn(dummyRepository, 'deleteOne');
      const result = await dummyService.deleteOne(deletedCriteriaPayload);

      expect(dummyRepository.deleteOne).toHaveBeenCalledWith(
        deletedCriteriaPayload,
      );
      expect(result).toEqualPayload({ acknowledged: true, deletedCount: 1 });
    });
  });
});
