/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MongooseModule } from '@nestjs/mongoose';

import { nlpEntityFixtures } from '@/utils/test/fixtures/nlpentity';
import { installNlpValueFixtures } from '@/utils/test/fixtures/nlpvalue';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { NlpEntityRepository } from '../repositories/nlp-entity.repository';
import { NlpSampleEntityRepository } from '../repositories/nlp-sample-entity.repository';
import { NlpValueRepository } from '../repositories/nlp-value.repository';
import {
  NlpEntity,
  NlpEntityFull,
  NlpEntityModel,
} from '../schemas/nlp-entity.schema';
import { NlpSampleEntityModel } from '../schemas/nlp-sample-entity.schema';
import { NlpValueModel } from '../schemas/nlp-value.schema';

import { NlpEntityService } from './nlp-entity.service';
import { NlpValueService } from './nlp-value.service';

describe('nlpEntityService', () => {
  let nlpEntityService: NlpEntityService;
  let nlpEntityRepository: NlpEntityRepository;
  let nlpValueRepository: NlpValueRepository;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      imports: [
        rootMongooseTestModule(installNlpValueFixtures),
        MongooseModule.forFeature([
          NlpEntityModel,
          NlpValueModel,
          NlpSampleEntityModel,
        ]),
      ],
      providers: [
        NlpEntityService,
        NlpEntityRepository,
        NlpValueService,
        NlpValueRepository,
        NlpSampleEntityRepository,
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
          },
        },
      ],
    });
    [nlpEntityService, nlpEntityRepository, nlpValueRepository] =
      await getMocks([
        NlpEntityService,
        NlpEntityRepository,
        NlpValueRepository,
      ]);
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('The deleteCascadeOne function', () => {
    it('should delete a nlp entity', async () => {
      const intentNlpEntity = await nlpEntityRepository.findOne({
        name: 'intent',
      });
      const result = await nlpEntityService.deleteCascadeOne(
        intentNlpEntity!.id,
      );
      expect(result.deletedCount).toEqual(1);
    });
  });

  describe('findOneAndPopulate', () => {
    it('should return a nlp entity with populate', async () => {
      const firstNameNlpEntity = await nlpEntityRepository.findOne({
        name: 'first_name',
      });
      const result = await nlpEntityService.findOneAndPopulate(
        firstNameNlpEntity!.id,
      );
      const firstNameValues = await nlpValueRepository.findOne({
        entity: firstNameNlpEntity!.id,
      });
      const entityWithValues = {
        id: firstNameNlpEntity!.id,
        ...nlpEntityFixtures[1],
        values: [firstNameValues],
      };
      expect(result).toEqualPayload(entityWithValues);
    });
  });

  describe('findPageAndPopulate', () => {
    it('should return all nlp entities with populate', async () => {
      const pageQuery = getPageQuery<NlpEntity>({ sort: ['name', 'desc'] });
      const firstNameNlpEntity = await nlpEntityRepository.findOne({
        name: 'first_name',
      });
      const result = await nlpEntityService.findPageAndPopulate(
        { _id: firstNameNlpEntity!.id },
        pageQuery,
      );
      const firstNameValues = await nlpValueRepository.findOne({
        entity: firstNameNlpEntity!.id,
      });
      const entitiesWithValues = [
        {
          id: firstNameNlpEntity!.id,
          ...nlpEntityFixtures[1],
          values: [firstNameValues],
        },
      ];
      expect(result).toEqualPayload(entitiesWithValues);
    });
  });
  describe('NlpEntityService - updateWeight', () => {
    let createdEntity: NlpEntity;
    beforeEach(async () => {
      createdEntity = await nlpEntityRepository.create({
        name: 'testentity',
        builtin: false,
        weight: 3,
      });
    });

    it('should update the weight of an NLP entity', async () => {
      const newWeight = 8;

      const updatedEntity = await nlpEntityService.updateWeight(
        createdEntity.id,
        newWeight,
      );

      expect(updatedEntity.weight).toBe(newWeight);
    });

    it('should handle updating weight of non-existent entity', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011'; // Example MongoDB ObjectId

      try {
        await nlpEntityService.updateWeight(nonExistentId, 5);
        fail('Expected error was not thrown');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should use default weight of 1 when creating entity without weight', async () => {
      const createdEntity = await nlpEntityRepository.create({
        name: 'entityWithoutWeight',
        builtin: true,
        // weight not specified
      });

      expect(createdEntity.weight).toBe(1);
    });

    it('should throw an error if weight is less than 1', async () => {
      const invalidWeight = 0;

      await expect(
        nlpEntityService.updateWeight(createdEntity.id, invalidWeight),
      ).rejects.toThrow('Weight must be a positive integer');
    });

    it('should throw an error if weight is a decimal', async () => {
      const invalidWeight = 2.5;

      await expect(
        nlpEntityService.updateWeight(createdEntity.id, invalidWeight),
      ).rejects.toThrow('Weight must be a positive integer');
    });

    it('should throw an error if weight is negative', async () => {
      const invalidWeight = -3;

      await expect(
        nlpEntityService.updateWeight(createdEntity.id, invalidWeight),
      ).rejects.toThrow('Weight must be a positive integer');
    });

    afterEach(async () => {
      // Clean the collection after each test
      await nlpEntityRepository.deleteOne(createdEntity.id);
    });
  });

  describe('storeNewEntities', () => {
    it('should store new entities', async () => {
      const result = await nlpEntityService.storeNewEntities(
        'Mein Name ist Hexabot',
        [
          { entity: 'intent', value: 'Name' },
          { entity: 'language', value: 'de' },
        ],
        ['trait'],
      );
      const intentEntity = await nlpEntityRepository.findOne({
        name: 'intent',
      });
      const languageEntity = await nlpEntityRepository.findOne({
        name: 'language',
      });
      const nameValue = await nlpValueRepository.findOne({ value: 'Name' });
      const deValue = await nlpValueRepository.findOne({ value: 'de' });
      const storedEntites = [
        {
          entity: intentEntity!.id,
          value: nameValue!.id,
        },
        {
          entity: languageEntity!.id,
          value: deValue!.id,
        },
      ];

      expect(result).toEqualPayload(storedEntites);
    });
  });
  describe('getNlpMap', () => {
    it('should return a NlpCacheMap with the correct structure', async () => {
      // Arrange
      const firstMockValues = {
        id: '1',
        weight: 1,
      };
      const firstMockEntity = {
        name: 'intent',
        ...firstMockValues,
        values: [{ value: 'buy' }, { value: 'sell' }],
      } as unknown as Partial<NlpEntityFull>;
      const secondMockValues = {
        id: '2',
        weight: 5,
      };
      const secondMockEntity = {
        name: 'subject',
        ...secondMockValues,
        values: [{ value: 'product' }],
      } as unknown as Partial<NlpEntityFull>;
      const mockEntities = [firstMockEntity, secondMockEntity];

      // Mock findAndPopulate
      jest
        .spyOn(nlpEntityService, 'findAllAndPopulate')
        .mockResolvedValue(mockEntities as unknown as NlpEntityFull[]);

      // Act
      const result = await nlpEntityService.getNlpMap();

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(2);
      expect(result.get('intent')).toEqual({
        name: 'intent',
        ...firstMockEntity,
      });
      expect(result.get('subject')).toEqual({
        name: 'subject',
        ...secondMockEntity,
      });
    });
  });
});
