/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { TestingModule } from '@nestjs/testing';

import { Language } from '@/i18n/dto/language.dto';
import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { nlpSampleFixtures } from '@/utils/test/fixtures/nlpsample';
import { installNlpSampleEntityFixturesTypeOrm } from '@/utils/test/fixtures/nlpsampleentity';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { NlpSampleState } from '..//types';
import { NlpSample } from '../dto/nlp-sample.dto';
import { NlpValue } from '../dto/nlp-value.dto';

import { NlpSampleEntityRepository } from './nlp-sample-entity.repository';
import { NlpSampleRepository } from './nlp-sample.repository';
import { NlpValueRepository } from './nlp-value.repository';

describe('NlpSampleRepository (TypeORM)', () => {
  let module: TestingModule;
  let nlpSampleRepository: NlpSampleRepository;
  let nlpSampleEntityRepository: NlpSampleEntityRepository;
  let nlpValueRepository: NlpValueRepository;
  let languageRepository: LanguageRepository;
  let languages: Language[];

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [
        NlpSampleRepository,
        NlpSampleEntityRepository,
        NlpValueRepository,
        LanguageRepository,
      ],
      typeorm: {
        fixtures: installNlpSampleEntityFixturesTypeOrm,
      },
    });

    module = testing.module;

    [
      nlpSampleRepository,
      nlpSampleEntityRepository,
      nlpValueRepository,
      languageRepository,
    ] = await testing.getMocks([
      NlpSampleRepository,
      NlpSampleEntityRepository,
      NlpValueRepository,
      LanguageRepository,
    ]);

    languages = await languageRepository.findAll();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('findOneAndPopulate', () => {
    it('should return a populated sample', async () => {
      const noSample = await nlpSampleRepository.findOne({
        where: { text: 'No' },
      });
      const result = await nlpSampleRepository.findOneAndPopulate(noSample!.id);

      expect(result).toBeDefined();
      expect(result?.entities).toBeDefined();
      expect(Array.isArray(result?.entities)).toBe(true);
      expect(
        result?.language === null || !!(result?.language as any)?.code,
      ).toBe(true);
    });
  });

  describe('findAndPopulate', () => {
    it('should return paginated samples with relations', async () => {
      const result = await nlpSampleRepository.findAndPopulate({
        order: { text: 'DESC' },
      });

      result.forEach((sample) => {
        const fixture = nlpSampleFixtures.find((s) => s.text === sample.text);
        expect(fixture).toBeDefined();
        expect(sample.entities).toBeDefined();
      });
    });
  });

  describe('deleteOne', () => {
    it('should delete a sample and its entities', async () => {
      const createdSample = await nlpSampleRepository.create({
        text: 'sample-to-delete',
        trained: false,
        type: NlpSampleState.train,
        language: languages[0]?.id ?? null,
      });
      const greetingValue = await nlpValueRepository.findOne({
        where: { value: 'greeting' },
      });

      await nlpSampleEntityRepository.create({
        sample: createdSample.id,
        entity: greetingValue?.entity ?? '',
        value: greetingValue!.id,
      });

      const result = await nlpSampleRepository.deleteOne(createdSample.id);

      expect(result.deletedCount).toBe(1);
      const remaining = await nlpSampleEntityRepository.find({
        where: { sample: { id: createdSample.id } },
      });
      expect(remaining.length).toBe(0);
    });
  });

  describe('findByEntities', () => {
    it('should return samples matching values', async () => {
      const values = await nlpValueRepository.find({
        where: { value: 'greeting' },
      });
      const result = await nlpSampleRepository.findByEntities({
        options: {},
        values,
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toBeInstanceOf(NlpSample);
    });

    it('should return empty array when no values match', async () => {
      const values = [
        {
          id: randomUUID(),
          entity: randomUUID(),
          value: 'nonexistent',
        },
      ] as unknown as NlpValue[];
      const result = await nlpSampleRepository.findByEntities({ values });

      expect(result).toHaveLength(0);
    });
  });

  describe('findByEntitiesAndPopulate', () => {
    it('should return populated samples', async () => {
      const values = await nlpValueRepository.find({
        where: { value: 'greeting' },
      });
      const result = await nlpSampleRepository.findByEntitiesAndPopulate({
        options: {},
        values,
      });

      expect(result.length).toBeGreaterThan(0);
      result.forEach((sample) => {
        expect(sample.entities).toBeDefined();
        expect(sample.language).toBeDefined();
      });
    });

    it('should respect pagination parameters', async () => {
      const values = await nlpValueRepository.find({
        where: { value: 'greeting' },
      });
      const options = {
        take: 1,
        skip: 0,
        order: { text: 'ASC' as const },
      };
      const result = await nlpSampleRepository.findByEntitiesAndPopulate({
        options,
        values,
      });

      expect(result.length).toBeLessThanOrEqual(1);
      if (result.length) {
        expect(result[0]).toHaveProperty('text');
      }
    });

    it('should return empty array when no samples match', async () => {
      const values = [
        {
          id: randomUUID(),
          entity: randomUUID(),
          value: 'nonexistent',
        },
      ] as unknown as NlpValue[];
      const result = await nlpSampleRepository.findByEntitiesAndPopulate({
        values,
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('countByEntities', () => {
    it('should count samples matching values', async () => {
      const values = await nlpValueRepository.find({
        where: { value: 'greeting' },
      });
      const count = await nlpSampleRepository.countByEntities({
        options: {},
        values,
      });

      expect(count).toBeGreaterThan(0);
    });

    it('should respect filters (e.g. language)', async () => {
      const values = await nlpValueRepository.find({
        where: { value: 'greeting' },
      });
      const language = languages[0];
      const count = await nlpSampleRepository.countByEntities({
        options: { where: { language: { id: language.id } } },
        values,
      });

      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 when values do not match', async () => {
      const values = [
        {
          id: randomUUID(),
          entity: randomUUID(),
          value: 'nonexistent',
        },
      ] as unknown as NlpValue[];
      const count = await nlpSampleRepository.countByEntities({ values });

      expect(count).toBe(0);
    });
  });
});
