/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { HelperService } from '@/helper/helper.service';
import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { Language, LanguageModel } from '@/i18n/schemas/language.schema';
import { LanguageService } from '@/i18n/services/language.service';
import { LoggerService } from '@/logger/logger.service';
import { SettingModel } from '@/setting/schemas/setting.schema';
import { SettingSeeder } from '@/setting/seeds/setting.seed';
import { SettingService } from '@/setting/services/setting.service';
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
import { NlpEntity, NlpEntityModel } from '../schemas/nlp-entity.schema';
import {
  NlpSampleEntity,
  NlpSampleEntityModel,
} from '../schemas/nlp-sample-entity.schema';
import {
  NlpSample,
  NlpSampleFull,
  NlpSampleModel,
} from '../schemas/nlp-sample.schema';
import { NlpValueModel } from '../schemas/nlp-value.schema';

import { SettingRepository } from './../../setting/repositories/setting.repository';
import { NlpEntityService } from './nlp-entity.service';
import { NlpSampleEntityService } from './nlp-sample-entity.service';
import { NlpSampleService } from './nlp-sample.service';
import { NlpValueService } from './nlp-value.service';

describe('NlpSampleService', () => {
  let nlpEntityService: NlpEntityService;
  let nlpSampleService: NlpSampleService;
  let nlpSampleEntityService: NlpSampleEntityService;
  let languageService: LanguageService;
  let nlpSampleEntityRepository: NlpSampleEntityRepository;
  let nlpSampleRepository: NlpSampleRepository;
  let languageRepository: LanguageRepository;
  let noNlpSample: NlpSample | null;
  let nlpSampleEntity: NlpSampleEntity | null;
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
          SettingModel,
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
        HelperService,
        SettingService,
        SettingRepository,
        SettingSeeder,
      ],
    }).compile();
    nlpEntityService = module.get<NlpEntityService>(NlpEntityService);
    nlpSampleService = module.get<NlpSampleService>(NlpSampleService);
    nlpSampleEntityService = module.get<NlpSampleEntityService>(
      NlpSampleEntityService,
    );
    nlpSampleRepository = module.get<NlpSampleRepository>(NlpSampleRepository);
    nlpSampleEntityRepository = module.get<NlpSampleEntityRepository>(
      NlpSampleEntityRepository,
    );
    nlpSampleEntityRepository = module.get<NlpSampleEntityRepository>(
      NlpSampleEntityRepository,
    );
    languageService = module.get<LanguageService>(LanguageService);
    languageRepository = module.get<LanguageRepository>(LanguageRepository);
    noNlpSample = await nlpSampleService.findOne({ text: 'No' });
    nlpSampleEntity = await nlpSampleEntityRepository.findOne({
      sample: noNlpSample!.id,
    });
    languages = await languageRepository.findAll();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should return a nlp Sample with populate', async () => {
      const result = await nlpSampleService.findOneAndPopulate(noNlpSample!.id);
      const sampleWithEntities = {
        ...nlpSampleFixtures[1],
        entities: [nlpSampleEntity],
        language: languages[nlpSampleFixtures[1].language!],
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
            language:
              languages.find((lang) => lang.id === currSample.language) || null,
          };
          acc.push(sampleWithEntities);
          return acc;
        },
        [] as NlpSampleFull[],
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
      const result = await nlpSampleService.deleteOne(noNlpSample!.id);
      expect(result.deletedCount).toEqual(1);
    });
  });

  describe('parseAndSaveDataset', () => {
    it('should throw NotFoundException if no entities are found', async () => {
      jest.spyOn(nlpEntityService, 'findAll').mockResolvedValue([]);

      await expect(
        nlpSampleService.parseAndSaveDataset(
          'text,intent,language\nHello,none,en',
        ),
      ).rejects.toThrow(NotFoundException);

      expect(nlpEntityService.findAll).toHaveBeenCalled();
    });

    it('should throw BadRequestException if CSV parsing fails', async () => {
      const invalidCSV = 'text,intent,language\n"Hello,none'; // Malformed CSV
      jest
        .spyOn(nlpEntityService, 'findAll')
        .mockResolvedValue([{ name: 'intent' } as NlpEntity]);
      jest.spyOn(languageService, 'getLanguages').mockResolvedValue({});
      jest
        .spyOn(languageService, 'getDefaultLanguage')
        .mockResolvedValue({ code: 'en' } as Language);

      await expect(
        nlpSampleService.parseAndSaveDataset(invalidCSV),
      ).rejects.toThrow(BadRequestException);
    });

    it('should filter out rows with "none" as intent', async () => {
      const mockData = 'text,intent,language\nHello,none,en\nHi,greet,en';
      jest
        .spyOn(nlpEntityService, 'findAll')
        .mockResolvedValue([{ name: 'intent' } as NlpEntity]);
      jest
        .spyOn(languageService, 'getLanguages')
        .mockResolvedValue({ en: { id: '1' } });
      jest
        .spyOn(languageService, 'getDefaultLanguage')
        .mockResolvedValue({ code: 'en' } as Language);
      jest.spyOn(nlpSampleService, 'find').mockResolvedValue([]);
      jest
        .spyOn(nlpSampleService, 'create')
        .mockResolvedValue({ id: '1', text: 'Hi' } as NlpSample);
      jest.spyOn(nlpSampleEntityService, 'createMany').mockResolvedValue([]);

      const result = await nlpSampleService.parseAndSaveDataset(mockData);

      expect(result).toHaveLength(1);
      expect(result[0].text).toEqual('Hi');
    });

    it('should fallback to the default language if the language is invalid', async () => {
      const mockData = 'text,intent,language\nHi,greet,invalidLang';
      jest
        .spyOn(nlpEntityService, 'findAll')
        .mockResolvedValue([{ name: 'intent' } as NlpEntity]);
      jest
        .spyOn(languageService, 'getLanguages')
        .mockResolvedValue({ en: { id: '1' } });
      jest
        .spyOn(languageService, 'getDefaultLanguage')
        .mockResolvedValue({ code: 'en' } as Language);
      jest.spyOn(nlpSampleService, 'find').mockResolvedValue([]);
      jest
        .spyOn(nlpSampleService, 'create')
        .mockResolvedValue({ id: '1', text: 'Hi' } as NlpSample);
      jest.spyOn(nlpSampleEntityService, 'createMany').mockResolvedValue([]);

      const result = await nlpSampleService.parseAndSaveDataset(mockData);

      expect(result).toHaveLength(1);
      expect(result[0].text).toEqual('Hi');
    });

    it('should successfully process and save valid dataset rows', async () => {
      const mockData = 'text,intent,language\nHi,greet,en\nBye,bye,en';
      const mockLanguages = { en: { id: '1' } };

      jest
        .spyOn(languageService, 'getLanguages')
        .mockResolvedValue(mockLanguages);
      jest
        .spyOn(languageService, 'getDefaultLanguage')
        .mockResolvedValue({ code: 'en' } as Language);
      jest.spyOn(nlpSampleService, 'find').mockResolvedValue([]);
      let id = 0;
      jest.spyOn(nlpSampleService, 'create').mockImplementation((s) => {
        return Promise.resolve({ id: (++id).toString(), ...s } as NlpSample);
      });
      jest.spyOn(nlpSampleEntityService, 'createMany').mockResolvedValue([]);

      const result = await nlpSampleService.parseAndSaveDataset(mockData);

      expect(nlpSampleEntityService.createMany).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result[0].text).toEqual('Hi');
      expect(result[1].text).toEqual('Bye');
    });
  });
});
