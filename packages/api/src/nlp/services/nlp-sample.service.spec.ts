/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';

import { NlpValueMatchPattern } from '@/chat/types/pattern';
import { LanguageOrmEntity } from '@/i18n/entities/language.entity';
import { installNlpSampleEntityFixturesTypeOrm } from '@/utils/test/fixtures/nlpsampleentity';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { NlpEntityOrmEntity } from '../entities/nlp-entity.entity';
import { NlpSampleEntityOrmEntity } from '../entities/nlp-sample-entity.entity';
import { NlpSampleOrmEntity } from '../entities/nlp-sample.entity';
import { NlpValueOrmEntity } from '../entities/nlp-value.entity';
import { NlpSampleRepository } from '../repositories/nlp-sample.repository';

import { NlpEntityService } from './nlp-entity.service';
import { NlpSampleEntityService } from './nlp-sample-entity.service';
import { NlpSampleService } from './nlp-sample.service';
import { NlpValueService } from './nlp-value.service';

describe('NlpSampleService (TypeORM)', () => {
  let module: TestingModule;
  let nlpSampleService: NlpSampleService;
  let nlpSampleRepository: NlpSampleRepository;

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [
        NlpSampleService,
        NlpSampleEntityService,
        NlpEntityService,
        NlpValueService,
      ],
      typeorm: {
        entities: [
          LanguageOrmEntity,
          NlpEntityOrmEntity,
          NlpValueOrmEntity,
          NlpSampleOrmEntity,
          NlpSampleEntityOrmEntity,
        ],
        fixtures: installNlpSampleEntityFixturesTypeOrm,
      },
    });

    module = testing.module;

    [nlpSampleService, nlpSampleRepository] = await testing.getMocks([
      NlpSampleService,
      NlpSampleRepository,
    ]);
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
      const sample = await nlpSampleRepository.findOne({
        where: { text: 'Hello' },
      });
      const result = await nlpSampleService.findOneAndPopulate(sample!.id);
      expect(result).toBeDefined();
      expect(result?.entities).toBeDefined();
    });
  });

  describe('findAndPopulate', () => {
    it('should return all samples with relations', async () => {
      const result = await nlpSampleService.findAndPopulate({
        order: { text: 'DESC' },
      });
      expect(result.length).toBeGreaterThan(0);
      result.forEach((sample) => {
        expect(Array.isArray(sample.entities)).toBe(true);
      });
    });
  });

  describe('deleteCascadeOne', () => {
    it('should delete a sample and cascade entities', async () => {
      const sample = await nlpSampleRepository.findOne({
        where: { text: 'Bye Jhon' },
      });
      const result = await nlpSampleService.deleteCascadeOne(sample!.id);
      expect(result.deletedCount).toBe(1);
    });
  });

  describe('findByPatterns', () => {
    it('should find samples matching intents', async () => {
      const patterns: NlpValueMatchPattern[] = [
        { entity: 'intent', match: 'value', value: 'greeting' },
      ];

      const result = await nlpSampleService.findByPatterns({
        patterns,
      });

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('countByPatterns', () => {
    it('should count samples that match', async () => {
      const patterns: NlpValueMatchPattern[] = [
        { entity: 'intent', match: 'value', value: 'greeting' },
      ];

      const count = await nlpSampleService.countByPatterns({
        patterns,
      });

      expect(count).toBeGreaterThan(0);
    });

    it('should return zero when no matches', async () => {
      const count = await nlpSampleService.countByPatterns({
        patterns: [{ entity: 'intent', match: 'value', value: 'nonexistent' }],
      });

      expect(count).toBe(0);
    });
  });
});
