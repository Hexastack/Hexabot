/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  BadRequestException,
  ConflictException,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import { FindManyOptions, In } from 'typeorm';

import { IGNORED_TEST_FIELDS } from '@/utils/test/constants';
import { nlpEntityFixtures } from '@/utils/test/fixtures/nlpentity';
import {
  installNlpValueFixturesTypeOrm,
  nlpValueFixtures,
} from '@/utils/test/fixtures/nlpvalue';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { TFixtures } from '@/utils/test/types';
import { buildTestingMocks } from '@/utils/test/utils';

import {
  NlpEntity,
  NlpEntityCreateDto,
  NlpEntityFull,
  NlpEntityUpdateDto,
} from '../dto/nlp-entity.dto';
import { NlpValue } from '../dto/nlp-value.dto';
import { NlpEntityOrmEntity } from '../entities/nlp-entity.entity';
import { NlpSampleEntityOrmEntity } from '../entities/nlp-sample-entity.entity';
import { NlpSampleOrmEntity } from '../entities/nlp-sample.entity';
import { NlpValueOrmEntity } from '../entities/nlp-value.entity';
import { NlpEntityService } from '../services/nlp-entity.service';
import { NlpValueService } from '../services/nlp-value.service';

import { NlpEntityController } from './nlp-entity.controller';

describe('NlpEntityController', () => {
  let nlpEntityController: NlpEntityController;
  let nlpValueService: NlpValueService;
  let nlpEntityService: NlpEntityService;
  let intentEntityId: string | null;
  let buitInEntityId: string | null;

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['controllers', 'providers'],
      controllers: [NlpEntityController],
      providers: [NlpEntityService, NlpValueService],
      typeorm: {
        entities: [
          NlpEntityOrmEntity,
          NlpValueOrmEntity,
          NlpSampleOrmEntity,
          NlpSampleEntityOrmEntity,
        ],
        fixtures: async (dataSource) => {
          await installNlpValueFixturesTypeOrm(dataSource);
        },
      },
    });

    [nlpEntityController, nlpValueService, nlpEntityService] =
      await testing.getMocks([
        NlpEntityController,
        NlpValueService,
        NlpEntityService,
      ]);
    intentEntityId =
      (
        await nlpEntityService.findOne({
          where: { name: 'intent' },
        })
      )?.id || null;
    buitInEntityId =
      (
        await nlpEntityService.findOne({
          where: { name: 'built_in' },
        })
      )?.id || null;
  });

  afterAll(async () => {
    await closeTypeOrmConnections();
  });

  afterEach(jest.clearAllMocks);

  describe('findPage', () => {
    it('should find nlp entities,and foreach nlp entity, populate the corresponding values', async () => {
      const result = await nlpEntityController.findPage(['values'], {
        order: { name: 'ASC' },
      });
      const entitiesWithValues = nlpEntityFixtures.reduce(
        (acc, { name, lookups, builtin, weight, doc }, index) => {
          acc.push({
            name,
            values: nlpValueFixtures.filter(
              ({ entity }) => parseInt(entity) === index,
            ) as unknown as NlpValue[],
            lookups: lookups!,
            builtin: builtin!,
            weight: weight!,
            doc,
          });

          return acc;
        },
        [] as TFixtures<NlpEntityFull>[],
      );
      const normalizeEntities = (
        entities: TFixtures<NlpEntityFull>[],
      ): TFixtures<NlpEntityFull>[] =>
        entities
          .map(({ values = [], ...entity }) => ({
            ...entity,
            values: [...values].sort((a, b) => a.value.localeCompare(b.value)),
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

      expect(
        normalizeEntities(result as TFixtures<NlpEntityFull>[]),
      ).toEqualPayload(normalizeEntities(entitiesWithValues), [
        ...IGNORED_TEST_FIELDS,
        'entity',
        'metadata',
      ]);
    });

    it('should find nlp entities', async () => {
      const options: FindManyOptions<NlpEntityOrmEntity> = {
        order: { name: 'DESC' },
      };
      const result = await nlpEntityController.findPage(
        ['invalidCriteria'],
        options,
      );
      expect(result).toEqualPayload(
        nlpEntityFixtures.sort((a, b) => {
          if (a.name > b.name) {
            return -1;
          }
          if (a.name < b.name) {
            return 1;
          }

          return 0;
        }),
      );
    });
  });

  describe('count', () => {
    it('should count the nlp entities', async () => {
      const result = await nlpEntityController.filterCount();
      const count = nlpEntityFixtures.length;
      expect(result).toEqual({ count });
    });
  });

  describe('create', () => {
    it('should create nlp entity', async () => {
      const sentimentEntity: NlpEntityCreateDto = {
        name: 'sentiment',
        lookups: ['trait'],
        builtin: false,
        weight: 1,
      };
      const result = await nlpEntityController.create(sentimentEntity);
      expect(result).toEqualPayload(sentimentEntity);
    });
  });

  describe('deleteOne', () => {
    it('should delete a nlp entity', async () => {
      const result = await nlpEntityController.deleteOne(intentEntityId!);
      expect(result.deletedCount).toEqual(1);
    });

    it('should throw exception when nlp entity id not found', async () => {
      await expect(
        nlpEntityController.deleteOne(intentEntityId!),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw exception when nlp entity is builtin', async () => {
      await expect(
        nlpEntityController.deleteOne(buitInEntityId!),
      ).rejects.toThrow(MethodNotAllowedException);
    });
  });

  describe('findOne', () => {
    it('should find a nlp entity', async () => {
      const firstNameEntity = await nlpEntityService.findOne({
        where: { name: 'firstname' },
      });
      const result = await nlpEntityController.findOne(firstNameEntity!.id, []);

      expect(result).toEqualPayload(
        nlpEntityFixtures.find(({ name }) => name === 'firstname')!,
      );
    });

    it('should find a nlp entity, and populate its values', async () => {
      const firstNameEntity = await nlpEntityService.findOne({
        where: { name: 'firstname' },
      });
      const firstNameValues = await nlpValueService.findOne({
        where: { value: 'jhon' },
      });
      const firstNameWithValues: NlpEntityFull = {
        ...firstNameEntity,
        values: firstNameValues ? [firstNameValues] : [],
        name: firstNameEntity!.name,
        id: firstNameEntity!.id,
        createdAt: firstNameEntity!.createdAt,
        updatedAt: firstNameEntity!.updatedAt,
        lookups: firstNameEntity!.lookups,
        builtin: firstNameEntity!.builtin,
        weight: firstNameEntity!.weight,
      };
      const result = await nlpEntityController.findOne(firstNameEntity!.id, [
        'values',
      ]);
      expect(result).toEqualPayload(firstNameWithValues);
    });

    it('should throw NotFoundException when Id does not exist', async () => {
      await expect(
        nlpEntityController.findOne(intentEntityId!, ['values']),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOne', () => {
    it('should update a nlp entity', async () => {
      const firstNameEntity = await nlpEntityService.findOne({
        where: { name: 'firstname' },
      });
      const updatedNlpEntity: NlpEntityCreateDto = {
        name: 'updated',
        doc: '',
        lookups: ['trait'],
        builtin: false,
        weight: 1,
      };
      const result = await nlpEntityController.updateOne(
        firstNameEntity!.id,
        updatedNlpEntity,
      );
      expect(result).toEqualPayload(updatedNlpEntity);
    });

    it('should throw exception when nlp entity id not found', async () => {
      const updateNlpEntity: NlpEntityCreateDto = {
        name: 'updated',
        doc: '',
        lookups: ['trait'],
        builtin: false,
      };
      await expect(
        nlpEntityController.updateOne(intentEntityId!, updateNlpEntity),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update weight if entity is builtin and weight is provided', async () => {
      const updatedNlpEntity: NlpEntityUpdateDto = {
        weight: 4,
      };
      const findOneSpy = jest.spyOn(nlpEntityService, 'findOne');
      const updateWeightSpy = jest.spyOn(nlpEntityService, 'updateWeight');
      const result = await nlpEntityController.updateOne(
        buitInEntityId!,
        updatedNlpEntity,
      );

      expect(findOneSpy).toHaveBeenCalledWith(buitInEntityId!);
      expect(updateWeightSpy).toHaveBeenCalledWith(
        buitInEntityId!,
        updatedNlpEntity.weight,
      );
      expect(result.weight).toBe(updatedNlpEntity.weight);
    });

    it('should throw an exception if entity is builtin but weight not provided', async () => {
      await expect(
        nlpEntityController.updateOne(buitInEntityId!, {
          name: 'updated',
          doc: '',
          lookups: ['trait'],
          builtin: false,
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should update only the weight of the builtin entity', async () => {
      const updatedNlpEntity: NlpEntityUpdateDto = {
        weight: 8,
      };
      const originalEntity: NlpEntity | null = await nlpEntityService.findOne(
        buitInEntityId!,
      );
      const result: NlpEntity = await nlpEntityController.updateOne(
        buitInEntityId!,
        updatedNlpEntity,
      );

      // Check weight is updated
      expect(result.weight).toBe(updatedNlpEntity.weight);

      Object.entries(originalEntity!).forEach(([key, value]) => {
        if (key !== 'weight' && key !== 'updatedAt') {
          expect(result[key as keyof typeof result]).toEqual(value);
        }
      });
    });
  });
  describe('deleteMany', () => {
    it('should delete multiple nlp entities', async () => {
      const entitiesToDelete = [
        (
          await nlpEntityService.findOne({
            where: { name: 'sentiment' },
          })
        )?.id,
        (
          await nlpEntityService.findOne({
            where: { name: 'updated' },
          })
        )?.id,
      ] as string[];
      const result = await nlpEntityController.deleteMany(entitiesToDelete);

      expect(result.deletedCount).toEqual(entitiesToDelete.length);
      const remainingEntities = await nlpEntityService.find({
        where: { id: In(entitiesToDelete) },
      });
      expect(remainingEntities.length).toBe(0);
    });

    it('should throw BadRequestException when no IDs are provided', async () => {
      await expect(nlpEntityController.deleteMany([])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when provided IDs do not exist', async () => {
      const nonExistentIds = [
        '2f8f1d3d-6a84-4c54-9b4b-7a5d2c3b0001',
        '2f8f1d3d-6a84-4c54-9b4b-7a5d2c3b0002',
      ];

      await expect(
        nlpEntityController.deleteMany(nonExistentIds),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
