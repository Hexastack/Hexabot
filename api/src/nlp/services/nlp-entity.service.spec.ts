/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

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
import { NlpEntity, NlpEntityModel } from '../schemas/nlp-entity.schema';
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
});
