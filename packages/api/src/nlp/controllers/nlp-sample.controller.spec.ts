/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { In } from 'typeorm';

import { NlpValueMatchPattern } from '@/chat/schemas/types/pattern';
import { Language } from '@/i18n/dto/language.dto';
import { LanguageOrmEntity as LanguageEntity } from '@/i18n/entities/language.entity';
import { LanguageService } from '@/i18n/services/language.service';
import { nlpSampleFixtures } from '@/utils/test/fixtures/nlpsample';
import { installNlpSampleEntityFixturesTypeOrm } from '@/utils/test/fixtures/nlpsampleentity';
import { getPageQuery } from '@/utils/test/pagination';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { TFixtures } from '@/utils/test/types';
import { buildTestingMocks } from '@/utils/test/utils';

import { NlpSampleState } from '..//types';
import { NlpSampleDto, NlpSampleFull } from '../dto/nlp-sample.dto';
import { NlpEntityOrmEntity } from '../entities/nlp-entity.entity';
import { NlpSampleEntityOrmEntity } from '../entities/nlp-sample-entity.entity';
import { NlpSampleOrmEntity } from '../entities/nlp-sample.entity';
import { NlpValueOrmEntity } from '../entities/nlp-value.entity';
import { NlpEntityService } from '../services/nlp-entity.service';
import { NlpSampleEntityService } from '../services/nlp-sample-entity.service';
import { NlpSampleService } from '../services/nlp-sample.service';
import { NlpValueService } from '../services/nlp-value.service';

import { NlpSampleController } from './nlp-sample.controller';

describe('NlpSampleController (TypeORM)', () => {
  let nlpSampleController: NlpSampleController;
  let nlpSampleEntityService: NlpSampleEntityService;
  let nlpSampleService: NlpSampleService;
  let languageService: LanguageService;
  let byeJhonSampleId: string | null;
  let languages: Language[];

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['controllers', 'providers'],
      controllers: [NlpSampleController],
      providers: [
        NlpSampleService,
        NlpSampleEntityService,
        NlpEntityService,
        NlpValueService,
        LanguageService,
      ],
      typeorm: {
        entities: [
          LanguageEntity,
          NlpEntityOrmEntity,
          NlpValueOrmEntity,
          NlpSampleOrmEntity,
          NlpSampleEntityOrmEntity,
        ],
        fixtures: installNlpSampleEntityFixturesTypeOrm,
      },
    });

    [
      nlpSampleController,
      nlpSampleEntityService,
      nlpSampleService,
      languageService,
    ] = await testing.getMocks([
      NlpSampleController,
      NlpSampleEntityService,
      NlpSampleService,
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await closeTypeOrmConnections();
  });

  describe('findPage', () => {
    it('should find nlp samples and populate requested relations', async () => {
      const pageQuery = getPageQuery<NlpSampleOrmEntity>({
        sort: ['text', 'desc'],
      });
      const result = await nlpSampleController.findPage(
        pageQuery,
        ['language', 'entities'],
        {},
      );

      const samples = await nlpSampleService.findAll();
      const sampleEntities = await nlpSampleEntityService.findAll();
      const expected = samples.reduce((acc, sample) => {
        acc.push({
          ...sample,
          entities: sampleEntities.filter(
            (entity) => entity.sample === sample.id,
          ),
          language:
            languages.find((language) => language.id === sample.language) ||
            null,
        });
        return acc;
      }, [] as TFixtures<NlpSampleFull>[]);

      expect(result).toEqualPayload(expected);
    });

    it('should find nlp samples without populating', async () => {
      const pageQuery = getPageQuery<NlpSampleOrmEntity>({
        sort: ['text', 'desc'],
      });
      const result = await nlpSampleController.findPage(
        pageQuery,
        ['invalid'],
        {},
      );

      const expected = await nlpSampleService.find({}, pageQuery);
      expect(result).toEqualPayload(expected);
    });

    it('should find nlp samples with patterns', async () => {
      const pageQuery = getPageQuery<NlpSampleOrmEntity>({
        sort: ['text', 'desc'],
      });
      const patterns: NlpValueMatchPattern[] = [
        { entity: 'intent', match: 'value', value: 'greeting' },
      ];

      const result = await nlpSampleController.findPage(
        pageQuery,
        ['language', 'entities'],
        {},
        patterns,
      );

      const expected = await nlpSampleService.findByPatternsAndPopulate(
        { filters: {}, patterns },
        pageQuery,
      );
      expect(result).toEqualPayload(expected);
    });

    it('should return empty array if no samples match the patterns', async () => {
      const pageQuery = getPageQuery<NlpSampleOrmEntity>({
        sort: ['text', 'desc'],
      });
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
      expect(result).toEqual({ count: nlpSampleFixtures.length });
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
      expect(result).toEqualPayload(
        {
          ...nlSample,
          language: enLang,
        },
        ['id', 'createdAt', 'updatedAt'],
      );
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
      const sample = await nlpSampleService.findOne({
        text: 'Hello',
      });
      if (!sample) {
        throw new Error('Expected sample to exist');
      }
      const result = await nlpSampleController.findOne(sample.id, []);

      expect(result).toEqualPayload(sample);
    });

    it('should find a nlp sample with populated relations', async () => {
      const sample = await nlpSampleService.findOne({
        text: 'Hello',
      });
      if (!sample) {
        throw new Error('Expected sample to exist');
      }
      const result = await nlpSampleController.findOne(sample.id, [
        'language',
        'entities',
      ]);
      const expected = await nlpSampleService.findOneAndPopulate(sample.id);
      if (!expected) {
        throw new Error('Expected populated sample to exist');
      }
      expect(result).toEqualPayload(expected);
    });

    it('should throw NotFoundException when Id does not exist', async () => {
      await expect(
        nlpSampleController.findOne('non-existing-id', []),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOne', () => {
    it('should update a nlp sample', async () => {
      const sample = await nlpSampleService.findOne({
        text: 'Hello',
      });
      if (!sample) {
        throw new Error('Expected sample to exist');
      }
      const updateDto: NlpSampleDto = {
        text: 'updated',
        trained: sample.trained,
        type: sample.type,
        entities: [],
        language: languages[0]?.code ?? 'en',
      };

      const result = await nlpSampleController.updateOne(sample.id, updateDto);
      expect(result.text).toEqual(updateDto.text);
      expect(result.language).toBeDefined();
      expect((result.language as Language).code).toEqual(updateDto.language);
    });

    it('should throw exception when nlp sample id not found', async () => {
      const updateDto: NlpSampleDto = {
        text: 'updated',
        trained: false,
        type: NlpSampleState.test,
        entities: [],
        language: languages[0]?.code ?? 'en',
      };
      await expect(
        nlpSampleController.updateOne('non-existing-id', updateDto),
      ).rejects.toThrow('Unable to execute updateOne() - No updates');
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple nlp samples', async () => {
      const samples = await nlpSampleService.findAll();
      const ids = samples.slice(0, 2).map((sample) => sample.id);
      const result = await nlpSampleController.deleteMany(ids);

      expect(result.deletedCount).toEqual(ids.length);
      const remaining = await nlpSampleService.find({
        id: In(ids),
      });
      expect(remaining.length).toBe(0);
    });

    it('should throw BadRequestException when no IDs are provided', async () => {
      await expect(nlpSampleController.deleteMany([])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when provided IDs do not exist', async () => {
      const nonExistentIds = ['non-existent-1', 'non-existent-2'];

      await expect(
        nlpSampleController.deleteMany(nonExistentIds),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
