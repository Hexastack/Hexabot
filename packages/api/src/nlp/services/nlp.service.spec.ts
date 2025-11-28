/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';

import LlmNluHelper from '@/extensions/helpers/llm-nlu/index.helper';
import { HelperService } from '@/helper/helper.service';
import { installNlpSampleEntityFixturesTypeOrm } from '@/utils/test/fixtures/nlpsampleentity';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { NlpEntityService } from './nlp-entity.service';
import { NlpSampleEntityService } from './nlp-sample-entity.service';
import { NlpSampleService } from './nlp-sample.service';
import { NlpValueService } from './nlp-value.service';
import { NlpService } from './nlp.service';

describe('NlpService (TypeORM)', () => {
  let module: TestingModule;
  let nlpService: NlpService;

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [
        NlpService,
        NlpSampleService,
        NlpEntityService,
        NlpValueService,
        NlpSampleEntityService,
        LlmNluHelper,
      ],
      typeorm: {
        fixtures: installNlpSampleEntityFixturesTypeOrm,
      },
    });

    module = testing.module;
    [nlpService] = await testing.getMocks([NlpService]);

    // Register helper so hooks can resolve
    module.get(HelperService).register(module.get(LlmNluHelper));
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

  describe('computePredictionScore', () => {
    it('should compute score as confidence * weight for matching entities', async () => {
      const result = await nlpService.computePredictionScore({
        entities: [
          { entity: 'intent', value: 'greeting', confidence: 0.98 },
          { entity: 'subject', value: 'product', confidence: 0.9 },
          { entity: 'firstname', value: 'Jhon', confidence: 0.78 },
          { entity: 'irrelevant', value: 'test', confidence: 1 },
        ],
      });

      expect(result.entities).toEqual([
        { entity: 'intent', value: 'greeting', confidence: 0.98, score: 0.98 },
        { entity: 'subject', value: 'product', confidence: 0.9, score: 0.855 },
        { entity: 'firstname', value: 'Jhon', confidence: 0.78, score: 0.663 },
      ]);
      expect(
        result.entities.every((entity) => typeof entity.score === 'number'),
      ).toBeTruthy();
    });

    it('should return empty array when no entity matches', async () => {
      const result = await nlpService.computePredictionScore({
        entities: [{ entity: 'unknown', value: 'x', confidence: 1 }],
      });

      expect(result.entities).toEqual([]);
    });
  });
});
