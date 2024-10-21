/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { Language, LanguageModel } from '@/i18n/schemas/language.schema';
import { nlpSampleFixtures } from '@/utils/test/fixtures/nlpsample';
import {
  installNlpSampleEntityFixtures,
  nlpSampleEntityFixtures,
} from '@/utils/test/fixtures/nlpsampleentity';
import { nlpValueFixtures } from '@/utils/test/fixtures/nlpvalue';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { NlpEntityModel, NlpEntity } from '../schemas/nlp-entity.schema';
import {
  NlpSampleEntityModel,
  NlpSampleEntity,
} from '../schemas/nlp-sample-entity.schema';
import { NlpSampleModel } from '../schemas/nlp-sample.schema';
import { NlpValueModel } from '../schemas/nlp-value.schema';

import { NlpEntityRepository } from './nlp-entity.repository';
import { NlpSampleEntityRepository } from './nlp-sample-entity.repository';
import { NlpValueRepository } from './nlp-value.repository';

describe('NlpSampleEntityRepository', () => {
  let nlpSampleEntityRepository: NlpSampleEntityRepository;
  let nlpEntityRepository: NlpEntityRepository;
  let languageRepository: LanguageRepository;
  let nlpSampleEntities: NlpSampleEntity[];
  let nlpEntities: NlpEntity[];
  let languages: Language[];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installNlpSampleEntityFixtures),
        MongooseModule.forFeature([
          NlpSampleEntityModel,
          NlpEntityModel,
          NlpValueModel,
          NlpSampleModel,
          LanguageModel,
        ]),
      ],
      providers: [
        NlpSampleEntityRepository,
        NlpEntityRepository,
        NlpValueRepository,
        LanguageRepository,
        EventEmitter2,
      ],
    }).compile();
    nlpSampleEntityRepository = module.get<NlpSampleEntityRepository>(
      NlpSampleEntityRepository,
    );
    nlpEntityRepository = module.get<NlpEntityRepository>(NlpEntityRepository);
    languageRepository = module.get<LanguageRepository>(LanguageRepository);
    nlpSampleEntities = await nlpSampleEntityRepository.findAll();
    nlpEntities = await nlpEntityRepository.findAll();
    languages = await languageRepository.findAll();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should return a nlp SampleEntity with populate', async () => {
      const result = await nlpSampleEntityRepository.findOneAndPopulate(
        nlpSampleEntities[0].id,
      );
      expect(result).toEqualPayload({
        ...nlpSampleEntityFixtures[0],
        entity: nlpEntities[0],
        value: { ...nlpValueFixtures[0], entity: nlpEntities[0].id },
        sample: {
          ...nlpSampleFixtures[0],
          language: languages[nlpSampleFixtures[0].language].id,
        },
      });
    });
  });

  describe('findPageAndPopulate', () => {
    it('should return all nlp entities with populate', async () => {
      const pageQuery = getPageQuery<NlpSampleEntity>({
        sort: ['value', 'asc'],
      });
      const result = await nlpSampleEntityRepository.findPageAndPopulate(
        {},
        pageQuery,
      );
      const nlpValueFixturesWithEntities = nlpValueFixtures.reduce(
        (acc, curr) => {
          const ValueWithEntities = {
            ...curr,
            entity: nlpEntities[0].id,
          };
          acc.push(ValueWithEntities);
          return acc;
        },
        [],
      );
      nlpValueFixturesWithEntities[2] = {
        ...nlpValueFixturesWithEntities[2],
        entity: nlpEntities[1].id,
      };

      const nlpSampleEntityFixturesWithPopulate =
        nlpSampleEntityFixtures.reduce((acc, curr) => {
          const sampleEntityWithPopulate = {
            ...curr,
            entity: nlpEntities[curr.entity],
            value: nlpValueFixturesWithEntities[curr.value],
            sample: {
              ...nlpSampleFixtures[curr.sample],
              language: languages[nlpSampleFixtures[curr.sample].language].id,
            },
          };
          acc.push(sampleEntityWithPopulate);
          return acc;
        }, []);
      expect(result).toEqualPayload(nlpSampleEntityFixturesWithPopulate);
    });
  });

  describe('The deleteCascadeOne function', () => {
    it('should delete a nlp SampleEntity', async () => {
      const result = await nlpSampleEntityRepository.deleteOne(
        nlpSampleEntities[1].id,
      );
      expect(result.deletedCount).toEqual(1);
    });
  });
});
