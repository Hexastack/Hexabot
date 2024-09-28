/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { Language, LanguageModel } from '@/i18n/schemas/language.schema';
import { nlpSampleFixtures } from '@/utils/test/fixtures/nlpsample';
import { installNlpSampleEntityFixtures } from '@/utils/test/fixtures/nlpsampleentity';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { NlpSampleEntityRepository } from './nlp-sample-entity.repository';
import { NlpSampleRepository } from './nlp-sample.repository';
import {
  NlpSampleEntityModel,
  NlpSampleEntity,
} from '../schemas/nlp-sample-entity.schema';
import { NlpSampleModel, NlpSample } from '../schemas/nlp-sample.schema';

describe('NlpSampleRepository', () => {
  let nlpSampleRepository: NlpSampleRepository;
  let nlpSampleEntityRepository: NlpSampleEntityRepository;
  let languageRepository: LanguageRepository;
  let nlpSampleEntity: NlpSampleEntity;
  let noNlpSample: NlpSample;
  let languages: Language[];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installNlpSampleEntityFixtures),
        MongooseModule.forFeature([
          NlpSampleModel,
          NlpSampleEntityModel,
          LanguageModel,
        ]),
      ],
      providers: [
        NlpSampleRepository,
        NlpSampleEntityRepository,
        LanguageRepository,
        EventEmitter2,
      ],
    }).compile();
    nlpSampleRepository = module.get<NlpSampleRepository>(NlpSampleRepository);
    nlpSampleEntityRepository = module.get<NlpSampleEntityRepository>(
      NlpSampleEntityRepository,
    );
    languageRepository = module.get<LanguageRepository>(LanguageRepository);
    noNlpSample = await nlpSampleRepository.findOne({ text: 'No' });
    nlpSampleEntity = await nlpSampleEntityRepository.findOne({
      sample: noNlpSample.id,
    });
    languages = await languageRepository.findAll();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should return a nlp Sample with populate', async () => {
      const result = await nlpSampleRepository.findOneAndPopulate(
        noNlpSample.id,
      );
      expect(result).toEqualPayload({
        ...nlpSampleFixtures[1],
        entities: [nlpSampleEntity],
        language: languages[nlpSampleFixtures[1].language],
      });
    });
  });

  describe('findPageAndPopulate', () => {
    it('should return all nlp samples with populate', async () => {
      const pageQuery = getPageQuery<NlpSample>({
        sort: ['text', 'desc'],
      });
      const result = await nlpSampleRepository.findPageAndPopulate(
        {},
        pageQuery,
      );
      const nlpSamples = await nlpSampleRepository.findAll();
      const nlpSampleEntities = await nlpSampleEntityRepository.findAll();

      const nlpSampleFixturesWithEntities = nlpSamples.reduce(
        (acc, currSample) => {
          const sampleWithEntities = {
            ...currSample,
            entities: nlpSampleEntities.filter((currSampleEntity) => {
              return currSampleEntity.sample === currSample.id;
            }),
            language: languages.find((lang) => currSample.language === lang.id),
          };
          acc.push(sampleWithEntities);
          return acc;
        },
        [],
      );
      expect(result).toEqualPayload(nlpSampleFixturesWithEntities);
    });
  });

  describe('updateMany', () => {
    it('should update many nlp samples', async () => {
      const result = await nlpSampleRepository.updateMany(
        {},
        {
          trained: false,
        },
      );

      expect(result.modifiedCount).toEqual(nlpSampleFixtures.length);
    });
  });

  describe('The deleteCascadeOne function', () => {
    it('should delete a nlp Sample', async () => {
      const result = await nlpSampleRepository.deleteOne(noNlpSample.id);
      expect(result.deletedCount).toEqual(1);
      const sampleEntities = await nlpSampleEntityRepository.find({
        sample: noNlpSample.id,
      });
      expect(sampleEntities.length).toEqual(0);
    });
  });
});
