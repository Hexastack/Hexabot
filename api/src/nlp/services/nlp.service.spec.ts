/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { installNlpValueFixtures } from '@/utils/test/fixtures/nlpvalue';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { NlpService } from './nlp.service';

describe('NlpService', () => {
  let nlpService: NlpService;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installNlpValueFixtures)],
      providers: [NlpService],
    });
    [nlpService] = await getMocks([NlpService]);
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('computePredictionScore()', () => {
    it('should compute score as confidence * weight for matched entities', async () => {
      const result = await nlpService.computePredictionScore({
        entities: [
          { entity: 'intent', value: 'greeting', confidence: 0.98 },
          { entity: 'subject', value: 'product', confidence: 0.9 },
          { entity: 'firstname', value: 'Jhon', confidence: 0.78 },
          { entity: 'irrelevant', value: 'test', confidence: 1 },
        ],
      });

      expect(result).toEqual({
        entities: [
          {
            entity: 'intent',
            value: 'greeting',
            confidence: 0.98,
            score: 0.98,
          },
          {
            entity: 'subject',
            value: 'product',
            confidence: 0.9,
            score: 0.855,
          },
          {
            entity: 'firstname',
            value: 'Jhon',
            confidence: 0.78,
            score: 0.663,
          },
        ],
      });
    });

    it('should return empty array if no entity matches', async () => {
      const result = await nlpService.computePredictionScore({
        entities: [{ entity: 'unknown', value: 'x', confidence: 1 }],
      });

      expect(result).toEqual({ entities: [] });
    });
  });
});
