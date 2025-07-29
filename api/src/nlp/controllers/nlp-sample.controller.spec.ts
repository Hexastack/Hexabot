/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { NlpValueMatchPattern } from '@/chat/schemas/types/pattern';
import { Language } from '@/i18n/schemas/language.schema';
import { LanguageService } from '@/i18n/services/language.service';
import { getUpdateOneError } from '@/utils/test/errors/messages';
import { installAttachmentFixtures } from '@/utils/test/fixtures/attachment';
import { nlpSampleFixtures } from '@/utils/test/fixtures/nlpsample';
import { installNlpSampleEntityFixtures } from '@/utils/test/fixtures/nlpsampleentity';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { TFixtures } from '@/utils/test/types';
import { buildTestingMocks } from '@/utils/test/utils';

import { NlpSampleDto } from '../dto/nlp-sample.dto';
import { NlpSample, NlpSampleFull } from '../schemas/nlp-sample.schema';
import { NlpSampleState } from '../schemas/types';
import { NlpEntityService } from '../services/nlp-entity.service';
import { NlpSampleEntityService } from '../services/nlp-sample-entity.service';
import { NlpSampleService } from '../services/nlp-sample.service';
import { NlpValueService } from '../services/nlp-value.service';

import { NlpSampleController } from './nlp-sample.controller';

describe('NlpSampleController', () => {
  let nlpSampleController: NlpSampleController;
  let nlpSampleEntityService: NlpSampleEntityService;
  let nlpSampleService: NlpSampleService;
  let nlpEntityService: NlpEntityService;
  let nlpValueService: NlpValueService;
  let languageService: LanguageService;
  let byeJhonSampleId: string | null;
  let languages: Language[];

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['controllers'],
      controllers: [NlpSampleController],
      imports: [
        rootMongooseTestModule(async () => {
          await installNlpSampleEntityFixtures();
          await installAttachmentFixtures();
        }),
      ],
    });
    [
      nlpSampleController,
      nlpSampleEntityService,
      nlpSampleService,
      nlpEntityService,
      nlpValueService,
      languageService,
    ] = await getMocks([
      NlpSampleController,
      NlpSampleEntityService,
      NlpSampleService,
      NlpEntityService,
      NlpValueService,
      LanguageService,
    ]);
    byeJhonSampleId =
      (
        await nlpSampleService.findOne({
          text: 'Bye Jhon',
        })
      )?.id || null;
    languages = await languageService.findAll();
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findPage', () => {
    it('should find nlp samples, and foreach sample populate the corresponding entities', async () => {
      const pageQuery = getPageQuery<NlpSample>({ sort: ['text', 'desc'] });
      const result = await nlpSampleController.findPage(
        pageQuery,
        ['language', 'entities'],
        {},
      );
      const nlpSamples = await nlpSampleService.findAll();
      const nlpSampleEntities = await nlpSampleEntityService.findAll();
      const nlpSampleFixturesWithEntities = nlpSamples.reduce(
        (acc, currSample) => {
          const sampleWithEntities = {
            ...currSample,
            entities: nlpSampleEntities.filter(
              (currSampleEntity) => currSampleEntity.sample === currSample.id,
            ),
            language:
              languages.find((lang) => lang.id === currSample.language) || null,
          };
          acc.push(sampleWithEntities);
          return acc;
        },
        [] as TFixtures<NlpSampleFull>[],
      );

      expect(result).toEqualPayload(nlpSampleFixturesWithEntities);
    });

    it('should find nlp samples', async () => {
      const pageQuery = getPageQuery<NlpSample>({ sort: ['text', 'desc'] });
      const result = await nlpSampleController.findPage(
        pageQuery,
        ['invalidCriteria'],
        {},
      );
      expect(result).toEqualPayload(
        nlpSampleFixtures.map((sample) => ({
          ...sample,
          language: sample.language ? languages[sample.language].id : null,
        })),
      );
    });

    it('should find nlp samples with patterns', async () => {
      const pageQuery = getPageQuery<NlpSample>({ sort: ['text', 'desc'] });
      const patterns: NlpValueMatchPattern[] = [
        { entity: 'intent', match: 'value', value: 'greeting' },
      ];
      const result = await nlpSampleController.findPage(
        pageQuery,
        ['language', 'entities'],
        {},
        patterns,
      );
      // Should only return samples matching the pattern
      const nlpSamples = await nlpSampleService.findByPatternsAndPopulate(
        { filters: {}, patterns },
        pageQuery,
      );
      expect(result).toEqualPayload(nlpSamples);
    });

    it('should return empty array if no samples match the patterns', async () => {
      const pageQuery = getPageQuery<NlpSample>({ sort: ['text', 'desc'] });
      const patterns: NlpValueMatchPattern[] = [
        { entity: 'intent', match: 'value', value: 'nonexistent' },
      ];
      jest.spyOn(nlpSampleService, 'findByPatternsAndPopulate');
      const result = await nlpSampleController.findPage(
        pageQuery,
        ['language', 'entities'],
        {},
        patterns,
      );
      expect(nlpSampleService.findByPatternsAndPopulate).toHaveBeenCalledTimes(
        1,
      );
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('count', () => {
    it('should count the nlp samples', async () => {
      jest.spyOn(nlpSampleService, 'count');
      const result = await nlpSampleController.count({});
      expect(nlpSampleService.count).toHaveBeenCalledTimes(1);
      const count = nlpSampleFixtures.length;
      expect(result).toEqual({ count });
    });
  });

  describe('create', () => {
    it('should create nlp sample', async () => {
      const enLang = await languageService.findOne({ code: 'en' });
      const nlSample: NlpSampleDto = {
        text: 'text1',
        trained: true,
        type: NlpSampleState.test,
        entities: [],
        language: 'en',
      };
      const result = await nlpSampleController.create(nlSample);
      expect(result).toEqualPayload({
        ...nlSample,
        language: enLang,
      });
    });
  });

  describe('deleteOne', () => {
    it('should delete a nlp sample', async () => {
      const result = await nlpSampleController.deleteOne(byeJhonSampleId!);
      expect(result.deletedCount).toEqual(1);
    });

    it('should throw exception when nlp sample id not found', async () => {
      await expect(
        nlpSampleController.deleteOne(byeJhonSampleId!),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should find a nlp sample', async () => {
      const yessSample = await nlpSampleService.findOne({
        text: 'yess',
      });
      const result = await nlpSampleController.findOne(yessSample!.id, [
        'invalidCreteria',
      ]);
      expect(result).toEqualPayload({
        ...nlpSampleFixtures[0],
        language: nlpSampleFixtures[0].language
          ? languages[nlpSampleFixtures?.[0]?.language]?.id
          : null,
      });
    });

    it('should find a nlp sample and populate its entities', async () => {
      const yessSample = await nlpSampleService.findOne({
        text: 'yess',
      });
      const yessSampleEntity = await nlpSampleEntityService.findOne({
        sample: yessSample!.id,
      });
      const result = await nlpSampleController.findOne(yessSample!.id, [
        'entities',
      ]);
      const samplesWithEntities = {
        ...nlpSampleFixtures[0],
        entities: [yessSampleEntity],
        language: nlpSampleFixtures[0].language
          ? languages[nlpSampleFixtures[0].language]
          : null,
      };
      expect(result).toEqualPayload(samplesWithEntities);
    });

    it('should throw NotFoundException when Id does not exist', async () => {
      await expect(
        nlpSampleController.findOne(byeJhonSampleId!, ['entities']),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOne', () => {
    it('should update a nlp sample', async () => {
      const yessSample = await nlpSampleService.findOne({
        text: 'yess',
      });
      const frLang = await languageService.findOne({
        code: 'fr',
      });
      const result = await nlpSampleController.updateOne(yessSample!.id, {
        text: 'updated',
        trained: true,
        type: NlpSampleState.test,
        entities: [
          {
            entity: 'intent',
            value: 'update',
          },
        ],
        language: 'fr',
      });
      const updatedSample = {
        text: 'updated',
        trained: false,
        type: NlpSampleState.test,
        entities: [
          {
            entity: expect.stringMatching(/^[a-z0-9]+$/),
            sample: expect.stringMatching(/^[a-z0-9]+$/),
            value: expect.stringMatching(/^[a-z0-9]+$/),
          },
        ],
        language: frLang,
      };
      expect(result.text).toEqual(updatedSample.text);
      expect(result.type).toEqual(updatedSample.type);
      expect(result.trained).toEqual(updatedSample.trained);
      expect(result.entities).toMatchObject(updatedSample.entities);
      expect(result.language).toEqualPayload(updatedSample.language!);
    });

    it('should throw exception when nlp sample id not found', async () => {
      await expect(
        nlpSampleController.updateOne(byeJhonSampleId!, {
          text: 'updated',
          trained: true,
          type: NlpSampleState.test,
          language: 'fr',
        }),
      ).rejects.toThrow(getUpdateOneError(NlpSample.name, byeJhonSampleId!));
    });
  });

  describe('importFile', () => {
    it('should throw exception when something is wrong with the upload', async () => {
      const file = {
        buffer: Buffer.from('', 'utf-8'),
        size: 0,
        mimetype: 'text/csv',
      } as Express.Multer.File;
      await expect(nlpSampleController.importFile(file)).rejects.toThrow(
        'Bad Request Exception',
      );
    });

    it('should return a failure if an error occurs when parsing csv file ', async () => {
      const mockCsvDataWithErrors: string = `intent,entities,lang,question
          greeting,person,en`;

      const buffer = Buffer.from(mockCsvDataWithErrors, 'utf-8');
      const file = {
        buffer,
        size: buffer.length,
        mimetype: 'text/csv',
      } as Express.Multer.File;
      await expect(nlpSampleController.importFile(file)).rejects.toThrow();
    });

    it('should import data from a CSV file', async () => {
      const mockCsvData: string = [
        `text,intent,language`,
        `How much does a BMW cost?,price,en`,
      ].join('\n');

      const buffer = Buffer.from(mockCsvData, 'utf-8');
      const file = {
        buffer,
        size: buffer.length,
        mimetype: 'text/csv',
      } as Express.Multer.File;
      const result = await nlpSampleController.importFile(file);
      const intentEntityResult = await nlpEntityService.findOne({
        name: 'intent',
      });
      const priceValueResult = await nlpValueService.findOne({
        value: 'price',
      });
      const textSampleResult = await nlpSampleService.findOne({
        text: 'How much does a BMW cost?',
      });
      const language = await languageService.findOne({
        code: 'en',
      });
      const intentEntity = {
        name: 'intent',
        lookups: ['trait'],
        doc: '',
        builtin: false,
        weight: 1,
      };
      const priceValueEntity = await nlpEntityService.findOne({
        name: 'intent',
      });
      const priceValue = {
        value: 'price',
        expressions: [],
        builtin: false,
        entity: priceValueEntity!.id,
        doc: '',
      };
      const textSample = {
        text: 'How much does a BMW cost?',
        trained: false,
        type: 'train',
        language: language!.id,
      };

      expect(intentEntityResult).toEqualPayload(intentEntity);
      expect(priceValueResult).toEqualPayload(priceValue);
      expect(textSampleResult).toEqualPayload(textSample);
      expect(result).toEqualPayload([textSample]);
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple nlp samples', async () => {
      const samplesToDelete = [
        (
          await nlpSampleService.findOne({
            text: 'How much does a BMW cost?',
          })
        )?.id,
        (
          await nlpSampleService.findOne({
            text: 'text1',
          })
        )?.id,
      ] as string[];

      const result = await nlpSampleController.deleteMany(samplesToDelete);

      expect(result.deletedCount).toEqual(samplesToDelete.length);
      const remainingSamples = await nlpSampleService.find({
        _id: { $in: samplesToDelete },
      });
      expect(remainingSamples.length).toBe(0);
    });

    it('should throw BadRequestException when no IDs are provided', async () => {
      await expect(nlpSampleController.deleteMany([])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when provided IDs do not exist', async () => {
      const nonExistentIds = [
        '614c1b2f58f4f04c876d6b8d',
        '614c1b2f58f4f04c876d6b8e',
      ];

      await expect(
        nlpSampleController.deleteMany(nonExistentIds),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('filterCount', () => {
    it('should count the nlp samples without patterns', async () => {
      const filters = { text: 'Hello' };
      jest.spyOn(nlpSampleService, 'countByPatterns');
      const result = await nlpSampleController.filterCount(filters, []);
      expect(nlpSampleService.countByPatterns).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ count: 1 });
    });

    it('should count the nlp samples with patterns', async () => {
      const filters = { text: 'Hello' };
      const patterns: NlpValueMatchPattern[] = [
        { entity: 'intent', match: 'value', value: 'greeting' },
      ];
      jest.spyOn(nlpSampleService, 'countByPatterns');
      const result = await nlpSampleController.filterCount(filters, patterns);
      expect(nlpSampleService.countByPatterns).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ count: 1 });
    });

    it('should return zero count when no samples match the filters and patterns', async () => {
      const filters = { text: 'Nonexistent' };
      const patterns: NlpValueMatchPattern[] = [
        { entity: 'intent', match: 'value', value: 'nonexistent' },
      ];
      const result = await nlpSampleController.filterCount(filters, patterns);
      expect(result).toEqual({ count: 0 });
    });
  });
});
