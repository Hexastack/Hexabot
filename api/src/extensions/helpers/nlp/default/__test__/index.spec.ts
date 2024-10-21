/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { HttpModule } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { LanguageModel } from '@/i18n/schemas/language.schema';
import { LanguageService } from '@/i18n/services/language.service';
import { LoggerService } from '@/logger/logger.service';
import { NlpEntityRepository } from '@/nlp/repositories/nlp-entity.repository';
import { NlpSampleEntityRepository } from '@/nlp/repositories/nlp-sample-entity.repository';
import { NlpSampleRepository } from '@/nlp/repositories/nlp-sample.repository';
import { NlpValueRepository } from '@/nlp/repositories/nlp-value.repository';
import { NlpEntityModel } from '@/nlp/schemas/nlp-entity.schema';
import { NlpSampleEntityModel } from '@/nlp/schemas/nlp-sample-entity.schema';
import { NlpSampleModel } from '@/nlp/schemas/nlp-sample.schema';
import { NlpValueModel } from '@/nlp/schemas/nlp-value.schema';
import { NlpEntityService } from '@/nlp/services/nlp-entity.service';
import { NlpSampleEntityService } from '@/nlp/services/nlp-sample-entity.service';
import { NlpSampleService } from '@/nlp/services/nlp-sample.service';
import { NlpValueService } from '@/nlp/services/nlp-value.service';
import { NlpService } from '@/nlp/services/nlp.service';
import { SettingService } from '@/setting/services/setting.service';
import { installNlpSampleEntityFixtures } from '@/utils/test/fixtures/nlpsampleentity';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import DefaultNlpHelper from '../index.nlp.helper';

import { entitiesMock, samplesMock } from './__mock__/base.mock';
import {
  nlpBestGuess,
  nlpEmptyFormated,
  nlpFormatted,
  nlpParseResult,
} from './index.mock';

describe('NLP Default Helper', () => {
  let settingService: SettingService;
  let nlpService: NlpService;
  let defaultNlpHelper: DefaultNlpHelper;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installNlpSampleEntityFixtures),
        MongooseModule.forFeature([
          NlpEntityModel,
          NlpValueModel,
          NlpSampleModel,
          NlpSampleEntityModel,
          LanguageModel,
        ]),
        HttpModule,
      ],
      providers: [
        NlpService,
        NlpSampleService,
        NlpSampleRepository,
        NlpEntityService,
        NlpEntityRepository,
        NlpValueService,
        NlpValueRepository,
        NlpSampleEntityService,
        NlpSampleEntityRepository,
        LanguageService,
        LanguageRepository,
        EventEmitter2,
        DefaultNlpHelper,
        LoggerService,
        {
          provide: SettingService,
          useValue: {
            getSettings: jest.fn(() => ({
              nlp_settings: {
                provider: 'default',
                endpoint: 'path',
                token: 'token',
                threshold: '0.5',
              },
            })),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();
    settingService = module.get<SettingService>(SettingService);
    nlpService = module.get<NlpService>(NlpService);
    defaultNlpHelper = module.get<DefaultNlpHelper>(DefaultNlpHelper);
    nlpService.setHelper('default', defaultNlpHelper);
    nlpService.initNLP();
  });

  afterAll(closeInMongodConnection);

  it('should init() properly', () => {
    const nlp = nlpService.getNLP();
    expect(nlp).toBeDefined();
  });

  it('should format empty training set properly', async () => {
    const nlp = nlpService.getNLP();
    const results = await nlp.format([], entitiesMock);
    expect(results).toEqual(nlpEmptyFormated);
  });

  it('should format training set properly', async () => {
    const nlp = nlpService.getNLP();
    const results = await nlp.format(samplesMock, entitiesMock);
    expect(results).toEqual(nlpFormatted);
  });

  it('should return best guess from empty parse results', () => {
    const nlp = nlpService.getNLP();
    const results = nlp.bestGuess(
      {
        entities: [],
        intent: {},
        intent_ranking: [],
        text: 'test',
      },
      false,
    );
    expect(results).toEqual({ entities: [] });
  });

  it('should return best guess from parse results', () => {
    const nlp = nlpService.getNLP();
    const results = nlp.bestGuess(nlpParseResult, false);
    expect(results).toEqual(nlpBestGuess);
  });

  it('should return best guess from parse results with threshold', async () => {
    const nlp = nlpService.getNLP();
    const results = nlp.bestGuess(nlpParseResult, true);
    const settings = await settingService.getSettings();
    const threshold = settings.nlp_settings.threshold;
    const thresholdGuess = {
      entities: nlpBestGuess.entities.filter(
        (g) =>
          g.confidence >
          (typeof threshold === 'string' ? parseFloat(threshold) : threshold),
      ),
    };
    expect(results).toEqual(thresholdGuess);
  });
});
