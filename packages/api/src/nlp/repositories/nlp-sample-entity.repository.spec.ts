/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Language as LanguageEntity } from '@/i18n/entities/language.entity';
import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { installLanguageFixturesTypeOrm } from '@/utils/test/fixtures/language';
import { nlpSampleFixtures } from '@/utils/test/fixtures/nlpsample';
import {
  installNlpSampleEntityFixtures,
  nlpSampleEntityFixtures,
} from '@/utils/test/fixtures/nlpsampleentity';
import { nlpValueFixtures } from '@/utils/test/fixtures/nlpvalue';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  closeTypeOrmConnections,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { TFixtures } from '@/utils/test/types';
import { buildTestingMocks } from '@/utils/test/utils';

import { NlpEntity } from '../schemas/nlp-entity.schema';
import {
  NlpSampleEntity,
  NlpSampleEntityFull,
} from '../schemas/nlp-sample-entity.schema';
import { NlpValueStub } from '../schemas/nlp-value.schema';

import { NlpEntityRepository } from './nlp-entity.repository';
import { NlpSampleEntityRepository } from './nlp-sample-entity.repository';

describe('NlpSampleEntityRepository', () => {
  let nlpSampleEntityRepository: NlpSampleEntityRepository;
  let nlpEntityRepository: NlpEntityRepository;
  let languageRepository: LanguageRepository;
  let nlpSampleEntities: NlpSampleEntity[];
  let nlpEntities: NlpEntity[];
  let languages: LanguageEntity[];

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      models: ['NlpSampleModel', 'NlpValueModel'],
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installNlpSampleEntityFixtures)],
      providers: [
        NlpSampleEntityRepository,
        NlpEntityRepository,
        LanguageRepository,
      ],
      typeorm: [
        {
          entities: [LanguageEntity],
          fixtures: installLanguageFixturesTypeOrm,
        },
      ],
    });
    [nlpSampleEntityRepository, nlpEntityRepository, languageRepository] =
      await getMocks([
        NlpSampleEntityRepository,
        NlpEntityRepository,
        LanguageRepository,
      ]);
    nlpSampleEntities = await nlpSampleEntityRepository.findAll();
    nlpEntities = await nlpEntityRepository.findAll();
    languages = await languageRepository.findAll();
  });

  afterAll(async () => {
    await closeInMongodConnection();
    await closeTypeOrmConnections();
  });

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should return a nlp SampleEntity with populate', async () => {
      const result = await nlpSampleEntityRepository.findOneAndPopulate(
        nlpSampleEntities[0].id,
      );
      expect(result).toEqualPayload({
        ...nlpSampleEntityFixtures[0],
        entity: nlpEntities[0],
        value: { ...nlpValueFixtures[0], entity: nlpEntities[0].id },
        sample: {
          ...nlpSampleFixtures[0],
          language: languages[nlpSampleFixtures[0].language!].id,
        },
      });
    });
  });

  describe('findAndPopulate', () => {
    it('should return all nlp entities with populate', async () => {
      const pageQuery = getPageQuery<NlpSampleEntity>({
        sort: ['value', 'asc'],
      });
      const result = await nlpSampleEntityRepository.findAndPopulate(
        {},
        pageQuery,
      );
      const nlpValueFixturesWithEntities = nlpValueFixtures.reduce(
        (acc, curr) => {
          const ValueWithEntities = {
            ...curr,
            entity: nlpEntities[0].id,
            expressions: curr.expressions!,
            builtin: curr.builtin!,
            metadata: curr.metadata!,
          };
          acc.push(ValueWithEntities);
          return acc;
        },
        [] as TFixtures<NlpValueStub>[],
      );
      nlpValueFixturesWithEntities[2] = {
        ...nlpValueFixturesWithEntities[2],
        entity: nlpEntities[1].id,
      };

      const nlpSampleEntityFixturesWithPopulate =
        nlpSampleEntityFixtures.reduce((acc, curr) => {
          const sampleEntityWithPopulate = {
            ...curr,
            entity: nlpEntities[curr.entity],
            value: nlpValueFixturesWithEntities[curr.value],
            sample: {
              ...nlpSampleFixtures[curr.sample],
              language: languages[nlpSampleFixtures[curr.sample].language].id,
            },
          };
          acc.push(sampleEntityWithPopulate);
          return acc;
        }, [] as TFixtures<NlpSampleEntityFull>[]);
      expect(result).toEqualPayload(nlpSampleEntityFixturesWithPopulate);
    });
  });

  describe('The deleteCascadeOne function', () => {
    it('should delete a nlp SampleEntity', async () => {
      const result = await nlpSampleEntityRepository.deleteOne(
        nlpSampleEntities[1].id,
      );
      expect(result.deletedCount).toEqual(1);
    });
  });
});
