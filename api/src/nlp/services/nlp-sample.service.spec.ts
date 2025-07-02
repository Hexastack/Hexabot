/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { NlpValueMatchPattern } from '@/chat/schemas/types/pattern';
import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { Language } from '@/i18n/schemas/language.schema';
import { LanguageService } from '@/i18n/services/language.service';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { nlpSampleFixtures } from '@/utils/test/fixtures/nlpsample';
import { installNlpSampleEntityFixtures } from '@/utils/test/fixtures/nlpsampleentity';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { NlpSampleEntityCreateDto } from '../dto/nlp-sample-entity.dto';
import { NlpSampleEntityRepository } from '../repositories/nlp-sample-entity.repository';
import { NlpSampleRepository } from '../repositories/nlp-sample.repository';
import { NlpEntity, NlpEntityFull } from '../schemas/nlp-entity.schema';
import { NlpSampleEntity } from '../schemas/nlp-sample-entity.schema';
import { NlpSample, NlpSampleFull } from '../schemas/nlp-sample.schema';

import { NlpEntityService } from './nlp-entity.service';
import { NlpSampleEntityService } from './nlp-sample-entity.service';
import { NlpSampleService } from './nlp-sample.service';
import { NlpValueService } from './nlp-value.service';

describe('NlpSampleService', () => {
  let nlpEntityService: NlpEntityService;
  let nlpSampleService: NlpSampleService;
  let nlpSampleEntityService: NlpSampleEntityService;
  let nlpValueService: NlpValueService;
  let languageService: LanguageService;
  let nlpSampleEntityRepository: NlpSampleEntityRepository;
  let nlpSampleRepository: NlpSampleRepository;
  let languageRepository: LanguageRepository;
  let noNlpSample: NlpSample | null;
  let nlpSampleEntity: NlpSampleEntity | null;
  let languages: Language[];

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installNlpSampleEntityFixtures)],
      providers: [NlpSampleService],
    });
    [
      nlpEntityService,
      nlpSampleService,
      nlpSampleEntityService,
      nlpValueService,
      nlpSampleRepository,
      nlpSampleEntityRepository,
      nlpSampleEntityRepository,
      languageService,
      languageRepository,
    ] = await getMocks([
      NlpEntityService,
      NlpSampleService,
      NlpSampleEntityService,
      NlpValueService,
      NlpSampleRepository,
      NlpSampleEntityRepository,
      NlpSampleEntityRepository,
      LanguageService,
      LanguageRepository,
    ]);
    noNlpSample = await nlpSampleService.findOne({ text: 'No' });
    nlpSampleEntity = await nlpSampleEntityRepository.findOne({
      sample: noNlpSample!.id,
    });
    languages = await languageRepository.findAll();
  });

  afterAll(closeInMongodConnection);

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

  describe('findAndPopulate', () => {
    it('should return all nlp samples with populate', async () => {
      const pageQuery = getPageQuery<NlpSample>({ sort: ['text', 'desc'] });
      const result = await nlpSampleService.findAndPopulate({}, pageQuery);
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
        .mockResolvedValue({ en: { id: '1' } } as unknown as Record<
          string,
          Language
        >);
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
        .mockResolvedValue({ en: { id: '1' } } as unknown as Record<
          string,
          Language
        >);
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
      const mockLanguages = { en: { id: '1' } } as unknown as Record<
        string,
        Language
      >;

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

  describe('annotateWithKeywordEntity', () => {
    it('should annotate samples when matching samples exist', async () => {
      const entity = {
        id: 'entity-id',
        name: 'entity_name',
        values: [
          {
            id: 'value-id',
            value: 'keyword',
            expressions: ['synonym1', 'synonym2'],
          },
        ],
      } as NlpEntityFull;

      const sampleText = 'This is a test sample with keyword in it.';
      const samples = [{ id: 'sample-id', text: sampleText }] as NlpSample[];

      const extractedMatches = [
        { sample: 'sample-id', entity: 'test_entity', value: 'keyword' },
      ] as NlpSampleEntityCreateDto[];

      const findSpy = jest
        .spyOn(nlpSampleService, 'find')
        .mockResolvedValue(samples);
      const extractSpy = jest
        .spyOn(nlpSampleEntityService, 'extractKeywordEntities')
        .mockReturnValue(extractedMatches);

      const findOrCreateSpy = jest
        .spyOn(nlpSampleEntityService, 'findOneOrCreate')
        .mockResolvedValue({} as NlpSampleEntity);

      await nlpSampleService.annotateWithKeywordEntity(entity);

      expect(findSpy).toHaveBeenCalledWith({
        text: { $regex: '\\b(keyword|synonym1|synonym2)\\b', $options: 'i' },
        type: ['train', 'test'],
      });

      expect(extractSpy).toHaveBeenCalledWith(samples[0], entity.values[0]);
      expect(findOrCreateSpy).toHaveBeenCalledWith(
        extractedMatches[0],
        extractedMatches[0],
      );
    });

    it('should not annotate when no matching samples are found', async () => {
      const entity = {
        id: 'entity-id',
        name: 'test_entity',
        values: [
          {
            value: 'keyword',
            expressions: ['synonym1', 'synonym2'],
          },
        ],
      } as NlpEntityFull;

      jest.spyOn(nlpSampleService, 'find').mockResolvedValue([]);
      const extractSpy = jest.spyOn(
        nlpSampleEntityService,
        'extractKeywordEntities',
      );

      await nlpSampleService.annotateWithKeywordEntity(entity);

      expect(extractSpy).not.toHaveBeenCalled();
    });
  });

  describe('findByPatterns', () => {
    it('should return samples without providing patterns', async () => {
      const result = await nlpSampleService.findByPatterns(
        { filters: {}, patterns: [] },
        undefined,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return samples matching the given patterns', async () => {
      // Assume pattern: entity 'intent', value 'greeting'
      const patterns: NlpValueMatchPattern[] = [
        { entity: 'intent', match: 'value', value: 'greeting' },
      ];
      jest.spyOn(nlpSampleRepository, 'findByEntities');
      jest.spyOn(nlpValueService, 'findByPatterns');
      const result = await nlpSampleService.findByPatterns(
        { filters: {}, patterns },
        undefined,
      );
      expect(nlpSampleRepository.findByEntities).toHaveBeenCalled();
      expect(nlpValueService.findByPatterns).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].text).toBe('Hello');
    });

    it('should return an empty array if no samples match the patterns', async () => {
      const patterns: NlpValueMatchPattern[] = [
        { entity: 'intent', match: 'value', value: 'nonexistent' },
      ];

      jest.spyOn(nlpSampleRepository, 'findByEntities');
      jest.spyOn(nlpValueService, 'findByPatterns');
      const result = await nlpSampleService.findByPatterns(
        { filters: {}, patterns },
        undefined,
      );

      expect(nlpSampleRepository.findByEntities).not.toHaveBeenCalled();
      expect(nlpValueService.findByPatterns).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should support pagination', async () => {
      const patterns: NlpValueMatchPattern[] = [
        { entity: 'intent', match: 'value', value: 'greeting' },
      ];
      const page: PageQueryDto<NlpSample> = {
        limit: 1,
        skip: 0,
        sort: ['text', 'asc'],
      };

      const result = await nlpSampleService.findByPatterns(
        { filters: {}, patterns },
        page,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });
  });

  describe('findByPatternsAndPopulate', () => {
    it('should return populated NlpSampleFull instances for matching patterns', async () => {
      const patterns: NlpValueMatchPattern[] = [
        { entity: 'intent', match: 'value', value: 'greeting' },
      ];

      const result = await nlpSampleService.findByPatternsAndPopulate(
        { filters: {}, patterns },
        undefined,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((sample) => {
        expect(sample).toBeInstanceOf(NlpSampleFull);
        expect(sample.entities).toBeDefined();
        expect(Array.isArray(sample.entities)).toBe(true);
        expect(sample.language).toBeDefined();
      });
    });

    it('should return populated NlpSampleFull without providing patterns', async () => {
      const result = await nlpSampleService.findByPatternsAndPopulate(
        { filters: { text: /Hello/gi }, patterns: [] },
        undefined,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toBeInstanceOf(NlpSampleFull);
      expect(result[0].entities).toBeDefined();
      expect(Array.isArray(result[0].entities)).toBe(true);
    });

    it('should return an empty array if no samples match the patterns', async () => {
      const patterns: NlpValueMatchPattern[] = [
        { entity: 'intent', match: 'value', value: 'nonexistent' },
      ];

      const result = await nlpSampleService.findByPatternsAndPopulate(
        { filters: {}, patterns },
        undefined,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should support pagination and projection', async () => {
      const patterns: NlpValueMatchPattern[] = [
        { entity: 'intent', match: 'value', value: 'greeting' },
      ];
      const page: PageQueryDto<NlpSample> = {
        limit: 1,
        skip: 0,
        sort: ['text', 'asc'],
      };

      const result = await nlpSampleService.findByPatternsAndPopulate(
        { filters: {}, patterns },
        page,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });
  });

  describe('countByPatterns', () => {
    it('should return the correct count for matching patterns', async () => {
      const patterns: NlpValueMatchPattern[] = [
        { entity: 'intent', match: 'value', value: 'greeting' },
      ];

      jest.spyOn(nlpSampleRepository, 'countByEntities');
      jest.spyOn(nlpValueService, 'findByPatterns');
      const count = await nlpSampleService.countByPatterns({
        filters: {},
        patterns,
      });

      expect(nlpSampleRepository.countByEntities).toHaveBeenCalled();
      expect(nlpValueService.findByPatterns).toHaveBeenCalled();
      expect(typeof count).toBe('number');
      expect(count).toBe(2);
    });

    it('should return the correct count without providing patterns', async () => {
      jest.spyOn(nlpSampleRepository, 'findByEntities');
      jest.spyOn(nlpValueService, 'findByPatterns');
      const count = await nlpSampleService.countByPatterns({
        filters: {},
        patterns: [],
      });

      expect(nlpSampleRepository.findByEntities).not.toHaveBeenCalled();
      expect(nlpValueService.findByPatterns).not.toHaveBeenCalled();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(2);
    });

    it('should return 0 if no samples match the patterns', async () => {
      const patterns: NlpValueMatchPattern[] = [
        { entity: 'intent', match: 'value', value: 'nonexistent' },
      ];

      const count = await nlpSampleService.countByPatterns({
        filters: {},
        patterns,
      });

      expect(count).toBe(0);
    });

    it('should respect filters (e.g. language)', async () => {
      const patterns: NlpValueMatchPattern[] = [
        { entity: 'intent', match: 'value', value: 'greeting' },
      ];
      const filters = { text: 'Hello' };

      const count = await nlpSampleService.countByPatterns({
        filters,
        patterns,
      });

      expect(typeof count).toBe('number');
      expect(count).toBe(1);
    });
  });
});
