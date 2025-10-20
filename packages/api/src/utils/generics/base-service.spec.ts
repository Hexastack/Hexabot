/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';

import { DummyOrmEntity } from '@/utils/test/dummy/entities/dummy.entity';
import { DummyRepository } from '@/utils/test/dummy/repositories/dummy.repository';
import { DummyService } from '@/utils/test/dummy/services/dummy.service';
import { installDummyFixturesTypeOrm } from '@/utils/test/fixtures/dummy';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

describe('BaseOrmService', () => {
  let dummyRepository: DummyRepository;
  let dummyService: DummyService;
  let module: TestingModule;
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
    const { module: testingModule, getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [DummyService],
      typeorm: {
        entities: [DummyOrmEntity],
        fixtures: installDummyFixturesTypeOrm,
      },
    });
    module = testingModule;
    [dummyRepository, dummyService] = await getMocks([
      DummyRepository,
      DummyService,
    ]);
  });

  afterEach(jest.clearAllMocks);

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

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

      expect(dummyRepository.findOne).toHaveBeenCalledWith(createdId);
      expect(result).not.toBeNull();
      const { id, createdAt, updatedAt, ...rest } = result!;
      expect(rest).toEqualPayload(createdPayload);
    });

    it('should find by options and return one dummy data', async () => {
      jest.spyOn(dummyRepository, 'findOne');
      const findOptions = { where: { dummy: createdPayload.dummy } };
      const result = await dummyService.findOne(findOptions);

      expect(dummyRepository.findOne).toHaveBeenCalledWith(findOptions);
      expect(result).not.toBeNull();
      const { id, createdAt, updatedAt, ...rest } = result!;
      expect(rest).toEqualPayload(createdPayload);
    });
  });

  describe('updateOne', () => {
    it('should update by id and return one dummy data', async () => {
      jest.spyOn(dummyRepository, 'updateOne');
      const result = await dummyService.updateOne(createdId, updatedPayload);

      expect(dummyRepository.updateOne).toHaveBeenCalledWith(
        createdId,
        updatedPayload,
        undefined,
      );
      const { id, createdAt, updatedAt, ...rest } = result;
      expect(rest).toEqualPayload(updatedPayload);
    });

    it('should update by options and return one dummy data', async () => {
      jest.spyOn(dummyRepository, 'updateOne');
      const findOptions = { where: { dummy: updatedPayload.dummy } };
      const result = await dummyService.updateOne(
        findOptions,
        updatedCriteriaPayload,
      );

      expect(dummyRepository.updateOne).toHaveBeenCalledWith(
        findOptions,
        updatedCriteriaPayload,
        undefined,
      );
      const { id, createdAt, updatedAt, ...rest } = result;
      expect(rest).toEqualPayload(updatedCriteriaPayload);
    });
  });

  describe('deleteOne', () => {
    it('should delete by id one dummy data', async () => {
      jest.spyOn(dummyRepository, 'deleteOne');
      const result = await dummyService.deleteOne(createdId);

      expect(dummyRepository.deleteOne).toHaveBeenCalledWith(createdId);
      expect(result).toEqualPayload({ acknowledged: true, deletedCount: 1 });
    });

    it('should delete by options one dummy data', async () => {
      jest.spyOn(dummyRepository, 'deleteOne');
      const findOptions = { where: deletedCriteriaPayload };
      const result = await dummyService.deleteOne(findOptions);

      expect(dummyRepository.deleteOne).toHaveBeenCalledWith(findOptions);
      expect(result).toEqualPayload({ acknowledged: true, deletedCount: 1 });
    });
  });
});
