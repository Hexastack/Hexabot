/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { FindManyOptions } from 'typeorm';

import { installNlpSampleEntityFixturesTypeOrm } from '@/utils/test/fixtures/nlpsampleentity';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';
import { Format } from '@/utils/types/format.types';

import { NlpEntity } from '../dto/nlp-entity.dto';
import { NlpValue, NlpValueFull } from '../dto/nlp-value.dto';
import { NlpValueOrmEntity } from '../entities/nlp-value.entity';
import { NlpEntityRepository } from '../repositories/nlp-entity.repository';
import { NlpValueRepository } from '../repositories/nlp-value.repository';

import { NlpEntityService } from './nlp-entity.service';
import { NlpValueService } from './nlp-value.service';

const mapToValueWithEntity = (
  value: NlpValue,
  entities: Record<string, NlpEntity>,
): NlpValueFull => ({
  ...value,
  entity:
    entities[value.entity as string] ?? (value.entity as unknown as NlpEntity),
});

describe('NlpValueService (TypeORM)', () => {
  let nlpValueService: NlpValueService;
  let nlpValueRepository: NlpValueRepository;
  let nlpEntityRepository: NlpEntityRepository;
  let storedValues: NlpValue[];
  let entitiesById: Record<string, NlpEntity>;

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [NlpValueService, NlpEntityService],
      typeorm: {
        fixtures: installNlpSampleEntityFixturesTypeOrm,
      },
    });

    [nlpValueService, nlpValueRepository, nlpEntityRepository] =
      await testing.getMocks([
        NlpValueService,
        NlpValueRepository,
        NlpEntityRepository,
      ]);

    storedValues = await nlpValueRepository.findAll();
    const entities = await nlpEntityRepository.findAll();
    entitiesById = entities.reduce<Record<string, NlpEntity>>((acc, entity) => {
      acc[entity.id] = entity;

      return acc;
    }, {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await closeTypeOrmConnections();
  });

  describe('findOneAndPopulate', () => {
    it('should return a value with its entity', async () => {
      const target = mapToValueWithEntity(storedValues[1], entitiesById);
      const result = await nlpValueService.findOneAndPopulate(target.id);
      expect(result).toEqualPayload(target);
    });
  });

  describe('findAndPopulate', () => {
    it('should return all values with populate', async () => {
      const result = await nlpValueService.findAndPopulate({
        order: { createdAt: 'ASC' as const },
      });
      const expected = storedValues.map((value) =>
        mapToValueWithEntity(value, entitiesById),
      );
      const sortByValue = <T extends { value: string }>(values: T[]) =>
        [...values].sort((a, b) => a.value.localeCompare(b.value));
      expect(sortByValue(result)).toEqualPayload(sortByValue(expected));
    });
  });

  describe('deleteCascadeOne', () => {
    it('should delete a value and cascade sample entities', async () => {
      const parent = await nlpEntityRepository.create({
        name: `value-parent-${randomUUID()}`,
      });
      const removable = await nlpValueRepository.create({
        entity: parent.id,
        value: `delete-${randomUUID()}`,
      });
      const result = await nlpValueService.deleteOne(removable.id);
      expect(result.deletedCount).toBe(1);
    });
  });

  describe('storeNewValues', () => {
    it('should store new values and return stored pairs', async () => {
      const storedEntities = await nlpEntityRepository.findAll();
      const result = await nlpValueService.storeNewValues(
        'Hello do you see me',
        [
          { entity: 'intent', value: 'greeting' },
          { entity: 'firstname', value: 'jhon' },
        ],
        storedEntities,
      );
      const greeting = await nlpValueRepository.findOne({
        where: { value: 'greeting' },
      });
      const jhon = await nlpValueRepository.findOne({
        where: { value: 'jhon' },
      });

      expect(result).toEqualPayload([
        { entity: greeting!.entity, value: greeting!.id },
        { entity: jhon!.entity, value: jhon!.id },
      ]);
    });
  });

  describe('storeValues', () => {
    it('should store values using existing entities', async () => {
      const sampleText = 'This is a test';
      const sampleEntities = [
        { entity: 'intent', value: 'greeting', start: 0, end: 7 },
      ];
      const result = await nlpValueService.storeValues(
        sampleText,
        sampleEntities,
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('value', 'greeting');
    });

    it('should throw when entity cannot be resolved', async () => {
      await expect(
        nlpValueService.storeValues('text', [
          { entity: 'unknown', value: 'value', start: 0, end: 5 },
        ]),
      ).rejects.toThrow('Unable to find the stored entity unknown');
    });
  });

  describe('findWithCount', () => {
    it('should call repository with stub format', async () => {
      const spy = jest.spyOn(nlpValueRepository, 'findWithCount');
      const options: FindManyOptions<NlpValueOrmEntity> = {
        skip: 0,
        take: 10,
        order: { value: 'ASC' },
      };
      const results = await nlpValueService.findWithCount(Format.STUB, options);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('nlpSamplesCount');
      expect(spy).toHaveBeenCalledWith(Format.STUB, options);
    });

    it('should call repository with full format', async () => {
      const spy = jest.spyOn(nlpValueRepository, 'findWithCount');
      const options: FindManyOptions<NlpValueOrmEntity> = {
        skip: 0,
        take: 10,
        order: { value: 'ASC' },
      };

      await nlpValueService.findWithCount(Format.FULL, options);

      expect(spy).toHaveBeenCalledWith(Format.FULL, options);
    });
  });
});
