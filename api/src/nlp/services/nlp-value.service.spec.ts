/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { MongooseModule } from '@nestjs/mongoose';

import { BaseSchema } from '@/utils/generics/base-schema';
import { nlpEntityFixtures } from '@/utils/test/fixtures/nlpentity';
import {
  installNlpValueFixtures,
  nlpValueFixtures,
} from '@/utils/test/fixtures/nlpvalue';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { NlpEntityRepository } from '../repositories/nlp-entity.repository';
import { NlpSampleEntityRepository } from '../repositories/nlp-sample-entity.repository';
import { NlpValueRepository } from '../repositories/nlp-value.repository';
import { NlpEntity, NlpEntityModel } from '../schemas/nlp-entity.schema';
import { NlpSampleEntityModel } from '../schemas/nlp-sample-entity.schema';
import {
  NlpValue,
  NlpValueFull,
  NlpValueModel,
} from '../schemas/nlp-value.schema';

import { NlpEntityService } from './nlp-entity.service';
import { NlpValueService } from './nlp-value.service';

describe('NlpValueService', () => {
  let nlpEntityService: NlpEntityService;
  let nlpValueService: NlpValueService;
  let nlpValueRepository: NlpValueRepository;
  let nlpEntityRepository: NlpEntityRepository;
  let nlpValues: NlpValue[];

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      imports: [
        rootMongooseTestModule(installNlpValueFixtures),
        MongooseModule.forFeature([
          NlpValueModel,
          NlpSampleEntityModel,
          NlpEntityModel,
        ]),
      ],
      providers: [
        NlpValueRepository,
        NlpSampleEntityRepository,
        NlpEntityRepository,
        NlpValueService,
        NlpEntityService,
      ],
    });
    [
      nlpValueService,
      nlpEntityService,
      nlpValueRepository,
      nlpEntityRepository,
    ] = await getMocks([
      NlpValueService,
      NlpEntityService,
      NlpValueRepository,
      NlpEntityRepository,
    ]);
    nlpValues = await nlpValueRepository.findAll();
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should return a nlp Value with populate', async () => {
      const result = await nlpValueService.findOneAndPopulate(nlpValues[1].id);
      const valueWithEntity = {
        ...nlpValueFixtures[1],
        entity: nlpEntityFixtures[0],
      };
      expect(result).toEqualPayload(valueWithEntity);
    });
  });

  describe('findPageAndPopulate', () => {
    it('should return all nlp entities with populate', async () => {
      const pageQuery = getPageQuery<NlpValue>({ sort: ['value', 'desc'] });
      const result = await nlpValueService.findPageAndPopulate({}, pageQuery);
      const nlpValueFixturesWithEntities = nlpValueFixtures.reduce(
        (acc, curr) => {
          const ValueWithEntities = {
            ...curr,
            entity: nlpEntityFixtures[parseInt(curr.entity!)] as NlpEntity,
            expressions: curr.expressions!,
            metadata: curr.metadata!,
            builtin: curr.builtin!,
          };
          acc.push(ValueWithEntities);
          return acc;
        },
        [] as Omit<NlpValueFull, keyof BaseSchema>[],
      );
      expect(result).toEqualPayload(nlpValueFixturesWithEntities);
    });
  });

  describe('The deleteCascadeOne function', () => {
    it('should delete a nlp Value', async () => {
      const result = await nlpValueService.deleteOne(nlpValues[1].id);
      expect(result.deletedCount).toEqual(1);
    });
  });

  describe('storeNewValues', () => {
    it('should store new values', async () => {
      const storedEntities = await nlpEntityRepository.findAll();
      const result = await nlpValueService.storeNewValues(
        'Hello do you see me',
        [
          { entity: 'intent', value: 'greeting' },
          { entity: 'first_name', value: 'jhon' },
        ],
        storedEntities,
      );
      const intentEntity = await nlpEntityRepository.findOne({
        name: 'intent',
      });
      const firstNameEntity = await nlpEntityRepository.findOne({
        name: 'first_name',
      });
      const greetingValue = await nlpValueRepository.findOne({
        value: 'greeting',
      });
      const jhonValue = await nlpValueRepository.findOne({ value: 'jhon' });
      const storedValues = [
        {
          entity: intentEntity!.id,
          value: greetingValue!.id,
        },
        {
          entity: firstNameEntity!.id,
          value: jhonValue!.id,
        },
      ];

      expect(result).toEqual(storedValues);
    });
  });

  describe('storeValues', () => {
    it('should store new values correctly', async () => {
      const sampleText = 'This is a test';
      const sampleEntities = [
        { entity: 'testEntity', value: 'testValue', start: 10, end: 14 },
      ];
      const expectedEntities = [{ name: 'testEntity', id: '9'.repeat(24) }];
      const mockFindResults = expectedEntities;

      jest
        .spyOn(nlpEntityService, 'find')
        .mockResolvedValue(mockFindResults as NlpEntity[]);
      jest
        .spyOn(nlpValueService, 'findOneOrCreate')
        .mockImplementation((_condition, newValue) =>
          Promise.resolve({
            ...newValue,
            expressions: [],
          } as unknown as NlpValue),
        );
      jest
        .spyOn(nlpValueService, 'updateOne')
        .mockImplementation((_condition, newValue) =>
          Promise.resolve({
            ...newValue,
            expressions: [],
          } as unknown as NlpValue),
        );

      const result = await nlpValueService.storeValues(
        sampleText,
        sampleEntities,
      );

      expect(nlpEntityService.find).toHaveBeenCalledWith({
        name: { $in: ['testEntity'] },
      });
      expect(nlpValueService.findOneOrCreate).toHaveBeenCalledTimes(1);
      expect(nlpValueService.updateOne).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
    });

    it('should throw an error if entity not found', async () => {
      const sampleText = 'This is a test';
      const sampleEntities = [
        { entity: 'unknownEntity', value: 'testValue', start: 10, end: 14 },
      ];

      jest.spyOn(nlpEntityService, 'find').mockResolvedValue([]);

      await expect(
        nlpValueService.storeValues(sampleText, sampleEntities),
      ).rejects.toThrow('Unable to find the stored entity unknownEntity');
    });
  });
});
