/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { installNlpValueFixturesTypeOrm } from '@/utils/test/fixtures/nlpvalue';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { NlpEntity, NlpEntityFull } from '../dto/nlp-entity.dto';
import { NlpEntityOrmEntity } from '../entities/nlp-entity.entity';
import { NlpSampleEntityOrmEntity } from '../entities/nlp-sample-entity.entity';
import { NlpSampleOrmEntity } from '../entities/nlp-sample.entity';
import { NlpValueOrmEntity } from '../entities/nlp-value.entity';
import { NlpEntityRepository } from '../repositories/nlp-entity.repository';
import { NlpValueRepository } from '../repositories/nlp-value.repository';

import { NlpEntityService } from './nlp-entity.service';
import { NlpValueService } from './nlp-value.service';

const createCacheMock = () => ({
  del: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
});

describe('NlpEntityService (TypeORM)', () => {
  let nlpEntityService: NlpEntityService;
  let nlpEntityRepository: NlpEntityRepository;
  let nlpValueRepository: NlpValueRepository;
  let cacheMock: ReturnType<typeof createCacheMock>;

  beforeAll(async () => {
    cacheMock = createCacheMock();

    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [
        NlpEntityService,
        NlpValueService,
        {
          provide: CACHE_MANAGER,
          useValue: cacheMock,
        },
      ],
      typeorm: {
        entities: [
          NlpEntityOrmEntity,
          NlpValueOrmEntity,
          NlpSampleOrmEntity,
          NlpSampleEntityOrmEntity,
        ],
        fixtures: installNlpValueFixturesTypeOrm,
      },
    });

    [nlpEntityService, nlpEntityRepository, nlpValueRepository] =
      await testing.getMocks([
        NlpEntityService,
        NlpEntityRepository,
        NlpValueRepository,
      ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await closeTypeOrmConnections();
  });

  describe('deleteCascadeOne', () => {
    it('should delete an entity and cascade values', async () => {
      const intentEntity = await nlpEntityRepository.findOne({
        where: { name: 'intent' },
      });

      const result = await nlpEntityService.deleteCascadeOne(intentEntity!.id);

      expect(result.deletedCount).toBe(1);
      const values = await nlpValueRepository.find({
        where: { entity: { id: intentEntity!.id } },
      });
      expect(values.length).toBe(0);
    });
  });

  describe('findOneAndPopulate', () => {
    it('should return a populated entity', async () => {
      const firstNameEntity = await nlpEntityRepository.findOne({
        where: { name: 'firstname' },
      });
      const result = await nlpEntityService.findOneAndPopulate(
        firstNameEntity!.id,
      );
      const expectedValues = await nlpValueRepository.find({
        where: { entity: { id: firstNameEntity!.id } },
      });

      expect(result).toEqualPayload(
        {
          ...firstNameEntity!,
          values: expectedValues,
        },
        ['createdAt', 'updatedAt'],
      );
    });
  });

  describe('findAndPopulate', () => {
    it('should return entities with populated values', async () => {
      const firstNameEntity = (await nlpEntityRepository.findOne({
        where: { name: 'firstname' },
      }))!;
      const result = await nlpEntityService.findAndPopulate({
        where: { name: firstNameEntity.name },
        order: { name: 'DESC' },
      });
      const expectedValues = await nlpValueRepository.find({
        where: { entity: { id: firstNameEntity.id } },
      });

      expect(result).toEqualPayload([
        {
          ...firstNameEntity,
          values: expectedValues,
        },
      ]);
    });
  });

  describe('updateWeight', () => {
    let createdEntity: NlpEntity;

    beforeEach(async () => {
      createdEntity = await nlpEntityRepository.create({
        name: `weight-${randomUUID()}`,
        builtin: false,
        weight: 3,
      });
    });

    afterEach(async () => {
      await nlpEntityRepository.deleteOne(createdEntity.id);
    });

    it('should update the weight', async () => {
      const updated = await nlpEntityService.updateWeight(createdEntity.id, 8);

      expect(updated.weight).toBe(8);
    });

    it('should throw for negative weight', async () => {
      await expect(
        nlpEntityService.updateWeight(createdEntity.id, -2),
      ).rejects.toThrow('Weight must be a strictly positive number');
    });

    it('should throw for unknown entity', async () => {
      await expect(
        nlpEntityService.updateWeight(randomUUID(), 5),
      ).rejects.toThrow();
    });

    it('should default weight to 1 when not provided', async () => {
      const builtin = await nlpEntityRepository.create({
        name: `builtin-${randomUUID()}`,
        builtin: true,
      });

      expect(builtin.weight).toBe(1);
      await nlpEntityRepository.deleteOne(builtin.id);
    });
  });

  describe('storeNewEntities', () => {
    it('should store new entities and values', async () => {
      const result = await nlpEntityService.storeNewEntities(
        'Mein Name ist Hexabot',
        [
          { entity: 'intent', value: 'Name' },
          { entity: 'language', value: 'de' },
        ],
        ['trait'],
      );

      const nameValue = await nlpValueRepository.findOne({
        where: { value: 'Name' },
      });
      const deValue = await nlpValueRepository.findOne({
        where: { value: 'de' },
      });

      expect(result).toHaveLength(2);
      expect(result).toEqualPayload([
        {
          entity: nameValue!.entity,
          value: nameValue!.id,
        },
        {
          entity: deValue!.entity,
          value: deValue!.id,
        },
      ]);
    });
  });

  describe('getNlpMap', () => {
    it('should return entries grouped by entity name', async () => {
      const map = await nlpEntityService.getNlpMap();

      expect(map instanceof Map).toBe(true);
      const firstname = map.get('firstname') as NlpEntityFull;
      expect(firstname).toBeDefined();
      expect(firstname.lookups).toContain('keywords');
      expect(firstname.values?.length).toBeGreaterThan(0);
    });

    it('should clear cache when cache is invalidated', async () => {
      await nlpEntityService.clearCache();
      expect(cacheMock.del).toHaveBeenCalledWith(expect.any(String));
    });
  });
});
