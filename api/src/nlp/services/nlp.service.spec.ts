/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
