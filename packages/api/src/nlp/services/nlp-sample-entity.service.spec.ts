/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import {
  installNlpSampleEntityFixturesTypeOrm,
  nlpSampleEntityFixtures,
} from '@/utils/test/fixtures/nlpsampleentity';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { NlpSampleState } from '..//types';
import { NlpSampleEntityCreateDto } from '../dto/nlp-sample-entity.dto';
import { NlpSample } from '../dto/nlp-sample.dto';
import { NlpValue } from '../dto/nlp-value.dto';
import { NlpEntityOrmEntity } from '../entities/nlp-entity.entity';
import { NlpSampleEntityOrmEntity } from '../entities/nlp-sample-entity.entity';
import { NlpSampleOrmEntity } from '../entities/nlp-sample.entity';
import { NlpValueOrmEntity } from '../entities/nlp-value.entity';

import { NlpEntityService } from './nlp-entity.service';
import { NlpSampleEntityService } from './nlp-sample-entity.service';
import { NlpValueService } from './nlp-value.service';

const createSampleStub = (id: string, text = 'sample text'): NlpSample => ({
  id,
  text,
  trained: false,
  type: NlpSampleState.train,
  language: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('NlpSampleEntityService (TypeORM)', () => {
  let nlpSampleEntityService: NlpSampleEntityService;

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [NlpSampleEntityService, NlpEntityService, NlpValueService],
      typeorm: {
        entities: [
          NlpEntityOrmEntity,
          NlpValueOrmEntity,
          NlpSampleOrmEntity,
          NlpSampleEntityOrmEntity,
        ],
        fixtures: installNlpSampleEntityFixturesTypeOrm,
      },
    });

    [nlpSampleEntityService] = await testing.getMocks([NlpSampleEntityService]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await closeTypeOrmConnections();
  });

  describe('storeSampleEntities', () => {
    it('should store sample entities using existing entities and values', async () => {
      const sample = createSampleStub(randomUUID());
      const entities: NlpSampleEntityCreateDto[] = nlpSampleEntityFixtures.map(
        (fixture) => ({
          ...fixture,
          sample: sample.id,
        }),
      );

      const storedEntities = await nlpSampleEntityService.storeSampleEntities(
        sample,
        entities,
      );

      expect(storedEntities.length).toBe(entities.length);
      storedEntities.forEach((entity) => {
        expect(entity.sample).toBe(sample.id);
      });
    });
  });

  describe('extractKeywordEntities', () => {
    it('should extract matches for value expressions', () => {
      const sample = createSampleStub(
        randomUUID(),
        'The sky is azure and emerald',
      );
      const value: NlpValue = {
        id: 'value-id',
        value: 'blue',
        expressions: ['azure', 'navy'],
        builtin: false,
        doc: '',
        entity: 'entity-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
      } as NlpValue;

      const matches = nlpSampleEntityService.extractKeywordEntities(
        sample,
        value,
      );

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]).toHaveProperty('start');
      expect(matches[0]).toHaveProperty('end');
    });
  });
});
