/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MongooseModule } from '@nestjs/mongoose';

import { HelperService } from '@/helper/helper.service';
import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { LanguageModel } from '@/i18n/schemas/language.schema';
import { LanguageService } from '@/i18n/services/language.service';
import { SettingRepository } from '@/setting/repositories/setting.repository';
import { SettingModel } from '@/setting/schemas/setting.schema';
import { SettingSeeder } from '@/setting/seeds/setting.seed';
import { SettingService } from '@/setting/services/setting.service';
import { installNlpValueFixtures } from '@/utils/test/fixtures/nlpvalue';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { NlpEntityRepository } from '../repositories/nlp-entity.repository';
import { NlpSampleEntityRepository } from '../repositories/nlp-sample-entity.repository';
import { NlpSampleRepository } from '../repositories/nlp-sample.repository';
import { NlpValueRepository } from '../repositories/nlp-value.repository';
import { NlpEntityModel } from '../schemas/nlp-entity.schema';
import { NlpSampleEntityModel } from '../schemas/nlp-sample-entity.schema';
import { NlpSampleModel } from '../schemas/nlp-sample.schema';
import { NlpValueModel } from '../schemas/nlp-value.schema';

import { NlpEntityService } from './nlp-entity.service';
import { NlpSampleEntityService } from './nlp-sample-entity.service';
import { NlpSampleService } from './nlp-sample.service';
import { NlpValueService } from './nlp-value.service';
import { NlpService } from './nlp.service';

describe('NlpService', () => {
  let nlpService: NlpService;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      imports: [
        rootMongooseTestModule(installNlpValueFixtures),
        MongooseModule.forFeature([
          NlpEntityModel,
          NlpValueModel,
          NlpSampleEntityModel,
          NlpSampleModel,
          LanguageModel,
          SettingModel,
        ]),
      ],
      providers: [
        NlpService,
        NlpEntityService,
        NlpEntityRepository,
        NlpValueService,
        NlpSampleService,
        NlpSampleEntityService,
        HelperService,
        LanguageService,
        SettingService,
        NlpValueRepository,
        NlpSampleEntityRepository,
        NlpSampleRepository,
        SettingRepository,
        SettingSeeder,
        LanguageRepository,
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
            set: jest.fn(),
            get: jest.fn(),
          },
        },
      ],
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
