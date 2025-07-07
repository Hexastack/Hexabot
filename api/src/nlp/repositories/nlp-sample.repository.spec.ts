/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Types } from 'mongoose';

import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { Language } from '@/i18n/schemas/language.schema';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { nlpSampleFixtures } from '@/utils/test/fixtures/nlpsample';
import { installNlpSampleEntityFixtures } from '@/utils/test/fixtures/nlpsampleentity';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { TFixtures } from '@/utils/test/types';
import { buildTestingMocks } from '@/utils/test/utils';

import { NlpSampleEntity } from '../schemas/nlp-sample-entity.schema';
import { NlpSample, NlpSampleFull } from '../schemas/nlp-sample.schema';
import { NlpValue } from '../schemas/nlp-value.schema';

import { NlpSampleEntityRepository } from './nlp-sample-entity.repository';
import { NlpSampleRepository } from './nlp-sample.repository';
import { NlpValueRepository } from './nlp-value.repository';

describe('NlpSampleRepository', () => {
  let nlpSampleRepository: NlpSampleRepository;
  let nlpSampleEntityRepository: NlpSampleEntityRepository;
  let nlpValueRepository: NlpValueRepository;
  let languageRepository: LanguageRepository;
  let nlpSampleEntity: NlpSampleEntity | null;
  let noNlpSample: NlpSample | null;
  let languages: Language[];

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installNlpSampleEntityFixtures)],
      providers: [
        NlpSampleRepository,
        NlpValueRepository,
        LanguageRepository,
        NlpSampleEntityRepository,
      ],
    });
    [
      nlpSampleRepository,
      nlpSampleEntityRepository,
      nlpValueRepository,
      languageRepository,
    ] = await getMocks([
      NlpSampleRepository,
      NlpSampleEntityRepository,
      NlpValueRepository,
      LanguageRepository,
    ]);
    noNlpSample = await nlpSampleRepository.findOne({ text: 'No' });
    nlpSampleEntity = await nlpSampleEntityRepository.findOne({
      sample: noNlpSample!.id,
    });
    languages = await languageRepository.findAll();
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should return a nlp Sample with populate', async () => {
      const result = await nlpSampleRepository.findOneAndPopulate(
        noNlpSample!.id,
      );
      expect(result).toEqualPayload({
        ...nlpSampleFixtures[1],
        entities: [nlpSampleEntity],
        language: languages[nlpSampleFixtures[1].language!],
      });
    });
  });

  describe('findAndPopulate', () => {
    it('should return all nlp samples with populate', async () => {
      const pageQuery = getPageQuery<NlpSample>({
        sort: ['text', 'desc'],
      });
      const result = await nlpSampleRepository.findAndPopulate({}, pageQuery);
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
              languages.find((lang) => currSample.language === lang.id) || null,
          };
          acc.push(sampleWithEntities);
          return acc;
        },
        [] as TFixtures<NlpSampleFull>[],
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
      const result = await nlpSampleRepository.deleteOne(noNlpSample!.id);
      expect(result.deletedCount).toEqual(1);
      const sampleEntities = await nlpSampleEntityRepository.find({
        sample: noNlpSample!.id,
      });
      expect(sampleEntities.length).toEqual(0);
    });
  });

  describe('findByEntities', () => {
    it('should return mapped NlpSample instances for matching entities', async () => {
      const filters = {};
      const values = await nlpValueRepository.find({ value: 'greeting' });

      const result = await nlpSampleRepository.findByEntities({
        filters,
        values,
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(NlpSample);
      expect(result[0].text).toBe('Hello');
    });

    it('should return an empty array if no samples match', async () => {
      const filters = {};
      const values = [
        {
          id: new Types.ObjectId().toHexString(),
          entity: new Types.ObjectId().toHexString(),
          value: 'nonexistent',
        },
      ] as NlpValue[];

      const result = await nlpSampleRepository.findByEntities({
        filters,
        values,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('findByEntitiesAndPopulate', () => {
    it('should return populated NlpSampleFull instances for matching entities', async () => {
      const filters = {};
      const values = await nlpValueRepository.find({ value: 'greeting' });

      const result = await nlpSampleRepository.findByEntitiesAndPopulate({
        filters,
        values,
      });

      expect(result.length).toBe(2);
      result.forEach((sample) => {
        expect(sample).toBeInstanceOf(NlpSampleFull);
        expect(sample.entities).toBeDefined();
        expect(Array.isArray(sample.entities)).toBe(true);
        expect(sample.language).toBeDefined();
      });
    });

    it('should return an empty array if no samples match', async () => {
      const filters = {};
      const values = [
        {
          id: new Types.ObjectId().toHexString(),
          entity: new Types.ObjectId().toHexString(),
          value: 'nonexistent',
        },
      ] as NlpValue[];

      const result = await nlpSampleRepository.findByEntitiesAndPopulate({
        filters,
        values,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should support pagination and projection', async () => {
      const filters = {};
      const values = await nlpValueRepository.find({ value: 'greeting' });
      const page = {
        limit: 1,
        skip: 0,
        sort: ['text', 'asc'],
      } as PageQueryDto<NlpSample>;
      const result = await nlpSampleRepository.findByEntitiesAndPopulate(
        { filters, values },
        page,
        { text: 1 },
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('text');
      }
    });
  });

  describe('countByEntities', () => {
    it('should return the correct count for matching entities', async () => {
      const filters = {};
      const values = await nlpValueRepository.find({ value: 'greeting' });

      const count = await nlpSampleRepository.countByEntities({
        filters,
        values,
      });

      expect(typeof count).toBe('number');
      expect(count).toBe(2);
    });

    it('should return 0 if no samples match', async () => {
      const filters = {};
      const values = [
        {
          id: new Types.ObjectId().toHexString(),
          entity: new Types.ObjectId().toHexString(),
          value: 'nonexistent',
        },
      ] as NlpValue[];

      const count = await nlpSampleRepository.countByEntities({
        filters,
        values,
      });

      expect(count).toBe(0);
    });

    it('should respect filters (e.g. language)', async () => {
      const values = await nlpValueRepository.find({ value: 'greeting' });
      const language = languages[0];
      const filters = { language: language.id };

      const count = await nlpSampleRepository.countByEntities({
        filters,
        values,
      });

      // Should be <= total greeting samples, and >= 0
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
      expect(count).toBeLessThanOrEqual(2);
    });
  });
});
