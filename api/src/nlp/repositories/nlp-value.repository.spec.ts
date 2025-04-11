/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { MongooseModule } from '@nestjs/mongoose';

import { nlpEntityFixtures } from '@/utils/test/fixtures/nlpentity';
import { installNlpSampleEntityFixtures } from '@/utils/test/fixtures/nlpsampleentity';
import { nlpValueFixtures } from '@/utils/test/fixtures/nlpvalue';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { TFixtures } from '@/utils/test/types';
import { buildTestingMocks } from '@/utils/test/utils';

import { NlpEntityModel } from '../schemas/nlp-entity.schema';
import { NlpSampleEntityModel } from '../schemas/nlp-sample-entity.schema';
import {
  NlpValue,
  NlpValueFull,
  NlpValueModel,
} from '../schemas/nlp-value.schema';

import { NlpSampleEntityRepository } from './nlp-sample-entity.repository';
import { NlpValueRepository } from './nlp-value.repository';

describe('NlpValueRepository', () => {
  let nlpValueRepository: NlpValueRepository;
  let nlpSampleEntityRepository: NlpSampleEntityRepository;
  let nlpValues: NlpValue[];

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      imports: [
        rootMongooseTestModule(installNlpSampleEntityFixtures),
        MongooseModule.forFeature([
          NlpValueModel,
          NlpSampleEntityModel,
          NlpEntityModel,
        ]),
      ],
      providers: [NlpValueRepository, NlpSampleEntityRepository],
    });
    [nlpValueRepository, nlpSampleEntityRepository] = await getMocks([
      NlpValueRepository,
      NlpSampleEntityRepository,
    ]);

    nlpValues = await nlpValueRepository.findAll();
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should return a nlp value with populate', async () => {
      const result = await nlpValueRepository.findOneAndPopulate(
        nlpValues[1].id,
      );
      expect(result).toEqualPayload({
        ...nlpValueFixtures[1],
        entity: nlpEntityFixtures[0],
      });
    });
  });

  describe('findPageAndPopulate', () => {
    it('should return all nlp entities with populate', async () => {
      const pageQuery = getPageQuery<NlpValue>({
        sort: ['value', 'desc'],
      });
      const result = await nlpValueRepository.findPageAndPopulate(
        {},
        pageQuery,
      );
      const nlpValueFixturesWithEntities = nlpValueFixtures.reduce(
        (acc, curr) => {
          const ValueWithEntities = {
            ...curr,
            entity: nlpEntityFixtures[
              parseInt(curr.entity!)
            ] as NlpValueFull['entity'],
            builtin: curr.builtin!,
            expressions: curr.expressions!,
            metadata: curr.metadata!,
          };
          acc.push(ValueWithEntities);
          return acc;
        },
        [] as TFixtures<NlpValueFull>[],
      );
      expect(result).toEqualPayload(nlpValueFixturesWithEntities);
    });
  });

  describe('The deleteCascadeOne function', () => {
    it('should delete a nlp Value', async () => {
      const result = await nlpValueRepository.deleteOne(nlpValues[1].id);
      expect(result.deletedCount).toEqual(1);
      const sampleEntities = await nlpSampleEntityRepository.find({
        value: nlpValues[1].id,
      });
      expect(sampleEntities.length).toEqual(0);
    });
  });
});
