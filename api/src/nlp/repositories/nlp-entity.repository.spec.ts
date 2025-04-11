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

import { NlpEntity, NlpEntityModel } from '../schemas/nlp-entity.schema';
import { NlpSampleEntityModel } from '../schemas/nlp-sample-entity.schema';
import { NlpValueModel } from '../schemas/nlp-value.schema';

import { NlpEntityRepository } from './nlp-entity.repository';
import { NlpSampleEntityRepository } from './nlp-sample-entity.repository';
import { NlpValueRepository } from './nlp-value.repository';

describe('NlpEntityRepository', () => {
  let nlpEntityRepository: NlpEntityRepository;
  let nlpValueRepository: NlpValueRepository;
  let firstNameNlpEntity: NlpEntity | null;

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
        NlpEntityRepository,
        NlpValueRepository,
        NlpSampleEntityRepository,
      ],
    });
    [nlpEntityRepository, nlpValueRepository] = await getMocks([
      NlpEntityRepository,
      NlpValueRepository,
    ]);
    firstNameNlpEntity = await nlpEntityRepository.findOne({
      name: 'first_name',
    });
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('The deleteCascadeOne function', () => {
    it('should delete a nlp entity', async () => {
      const intentNlpEntity = await nlpEntityRepository.findOne({
        name: 'intent',
      });
      const result = await nlpEntityRepository.deleteOne(intentNlpEntity!.id);

      expect(result.deletedCount).toEqual(1);

      const intentNlpValues = await nlpValueRepository.find({
        entity: intentNlpEntity!.id,
      });

      expect(intentNlpValues.length).toEqual(0);
    });
  });

  describe('findOneAndPopulate', () => {
    it('should return a nlp entity with populate', async () => {
      const firstNameValues = await nlpValueRepository.find({
        entity: firstNameNlpEntity!.id,
      });
      const result = await nlpEntityRepository.findOneAndPopulate(
        firstNameNlpEntity!.id,
      );
      expect(result).toEqualPayload({
        ...nlpEntityFixtures[1],
        values: firstNameValues,
      });
    });
  });

  describe('findPageAndPopulate', () => {
    it('should return all nlp entities with populate', async () => {
      const pageQuery = getPageQuery<NlpEntity>({
        sort: ['name', 'desc'],
      });
      const firstNameValues = await nlpValueRepository.find({
        entity: firstNameNlpEntity!.id,
      });
      const result = await nlpEntityRepository.findPageAndPopulate(
        { _id: firstNameNlpEntity!.id },
        pageQuery,
      );
      expect(result).toEqualPayload([
        {
          id: firstNameNlpEntity!.id,
          ...nlpEntityFixtures[1],
          values: firstNameValues,
        },
      ]);
    });
  });
});
