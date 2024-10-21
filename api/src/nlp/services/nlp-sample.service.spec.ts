/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { Language, LanguageModel } from '@/i18n/schemas/language.schema';
import { LanguageService } from '@/i18n/services/language.service';
import { LoggerService } from '@/logger/logger.service';
import { nlpSampleFixtures } from '@/utils/test/fixtures/nlpsample';
import { installNlpSampleEntityFixtures } from '@/utils/test/fixtures/nlpsampleentity';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { NlpEntityRepository } from '../repositories/nlp-entity.repository';
import { NlpSampleEntityRepository } from '../repositories/nlp-sample-entity.repository';
import { NlpSampleRepository } from '../repositories/nlp-sample.repository';
import { NlpValueRepository } from '../repositories/nlp-value.repository';
import { NlpEntityModel } from '../schemas/nlp-entity.schema';
import {
  NlpSampleEntity,
  NlpSampleEntityModel,
} from '../schemas/nlp-sample-entity.schema';
import { NlpSample, NlpSampleModel } from '../schemas/nlp-sample.schema';
import { NlpValueModel } from '../schemas/nlp-value.schema';

import { NlpEntityService } from './nlp-entity.service';
import { NlpSampleEntityService } from './nlp-sample-entity.service';
import { NlpSampleService } from './nlp-sample.service';
import { NlpValueService } from './nlp-value.service';

describe('NlpSampleService', () => {
  let nlpSampleService: NlpSampleService;
  let nlpSampleEntityRepository: NlpSampleEntityRepository;
  let nlpSampleRepository: NlpSampleRepository;
  let languageRepository: LanguageRepository;
  let noNlpSample: NlpSample;
  let nlpSampleEntity: NlpSampleEntity;
  let languages: Language[];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installNlpSampleEntityFixtures),
        MongooseModule.forFeature([
          NlpSampleModel,
          NlpSampleEntityModel,
          NlpValueModel,
          NlpEntityModel,
          LanguageModel,
        ]),
      ],
      providers: [
        NlpSampleRepository,
        NlpSampleEntityRepository,
        NlpEntityRepository,
        NlpValueRepository,
        LanguageRepository,
        NlpSampleService,
        NlpSampleEntityService,
        NlpEntityService,
        NlpValueService,
        LanguageService,
        EventEmitter2,
        LoggerService,
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();
    nlpSampleService = module.get<NlpSampleService>(NlpSampleService);
    nlpSampleRepository = module.get<NlpSampleRepository>(NlpSampleRepository);
    nlpSampleEntityRepository = module.get<NlpSampleEntityRepository>(
      NlpSampleEntityRepository,
    );
    nlpSampleEntityRepository = module.get<NlpSampleEntityRepository>(
      NlpSampleEntityRepository,
    );
    languageRepository = module.get<LanguageRepository>(LanguageRepository);
    noNlpSample = await nlpSampleService.findOne({ text: 'No' });
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
      const result = await nlpSampleService.findOneAndPopulate(noNlpSample.id);
      const sampleWithEntities = {
        ...nlpSampleFixtures[1],
        entities: [nlpSampleEntity],
        language: languages[nlpSampleFixtures[1].language],
      };
      expect(result).toEqualPayload(sampleWithEntities);
    });
  });

  describe('findPageAndPopulate', () => {
    it('should return all nlp samples with populate', async () => {
      const pageQuery = getPageQuery<NlpSample>({ sort: ['text', 'desc'] });
      const result = await nlpSampleService.findPageAndPopulate({}, pageQuery);
      const nlpSamples = await nlpSampleRepository.findAll();
      const nlpSampleEntities = await nlpSampleEntityRepository.findAll();

      const nlpSampleFixturesWithEntities = nlpSamples.reduce(
        (acc, currSample) => {
          const sampleWithEntities = {
            ...currSample,
            entities: nlpSampleEntities.filter((currSampleEntity) => {
              return currSampleEntity.sample === currSample.id;
            }),
            language: languages.find((lang) => lang.id === currSample.language),
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
      const result = await nlpSampleService.updateMany(
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
      const result = await nlpSampleService.deleteOne(noNlpSample.id);
      expect(result.deletedCount).toEqual(1);
    });
  });
});
