/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';

import { LanguageOrmEntity as LanguageEntity } from '@/i18n/entities/language.entity';
import {
  installNlpSampleEntityFixturesTypeOrm,
  nlpSampleEntityFixtures,
} from '@/utils/test/fixtures/nlpsampleentity';
import { getPageQuery } from '@/utils/test/pagination';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { NlpEntityOrmEntity } from '../entities/nlp-entity.entity';
import { NlpSampleEntityOrmEntity } from '../entities/nlp-sample-entity.entity';
import { NlpSampleOrmEntity } from '../entities/nlp-sample.entity';
import { NlpValueOrmEntity } from '../entities/nlp-value.entity';

import { NlpEntityRepository } from './nlp-entity.repository';
import { NlpSampleEntityRepository } from './nlp-sample-entity.repository';

describe('NlpSampleEntityRepository (TypeORM)', () => {
  let module: TestingModule;
  let nlpSampleEntityRepository: NlpSampleEntityRepository;

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [NlpSampleEntityRepository, NlpEntityRepository],
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

    module = testing.module;

    [nlpSampleEntityRepository] = await testing.getMocks([
      NlpSampleEntityRepository,
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
    it('should return a populated sample entity', async () => {
      const [first] = await nlpSampleEntityRepository.findAll();
      const result = await nlpSampleEntityRepository.findOneAndPopulate(
        first.id,
      );

      expect(result).toBeDefined();
      expect(result?.entity).toBeDefined();
      expect(result?.value).toBeDefined();
      expect(result?.sample).toBeDefined();
    });
  });

  describe('findAndPopulate', () => {
    it('should return populated sample entities', async () => {
      const pageQuery = getPageQuery<NlpSampleEntityOrmEntity>({
        sort: ['createdAt', 'asc'],
      });
      const result = await nlpSampleEntityRepository.findAndPopulate(
        {},
        pageQuery,
      );

      expect(result.length).toBe(nlpSampleEntityFixtures.length);
      result.forEach((entity) => {
        expect(entity.entity).toBeDefined();
        expect(entity.value).toBeDefined();
        expect(entity.sample).toBeDefined();
      });
    });
  });

  describe('deleteOne', () => {
    it('should delete a sample entity', async () => {
      const [first] = await nlpSampleEntityRepository.findAll();
      const result = await nlpSampleEntityRepository.deleteOne(first.id);

      expect(result.deletedCount).toBe(1);
    });
  });
});
