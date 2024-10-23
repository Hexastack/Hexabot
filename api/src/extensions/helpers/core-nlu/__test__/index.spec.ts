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

import { HelperService } from '@/helper/helper.service';
import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { LanguageModel } from '@/i18n/schemas/language.schema';
import { LanguageService } from '@/i18n/services/language.service';
import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';
import { installLanguageFixtures } from '@/utils/test/fixtures/language';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import CoreNluHelper from '../index.helper';

import { entitiesMock, samplesMock } from './__mock__/base.mock';
import {
  nlpBestGuess,
  nlpEmptyFormated,
  nlpFormatted,
  nlpParseResult,
} from './index.mock';

describe('Core NLU Helper', () => {
  let settingService: SettingService;
  let defaultNlpHelper: CoreNluHelper;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(async () => {
          await installLanguageFixtures();
        }),
        MongooseModule.forFeature([LanguageModel]),
        HttpModule,
      ],
      providers: [
        LanguageService,
        LanguageRepository,
        EventEmitter2,
        HelperService,
        CoreNluHelper,
        LoggerService,
        {
          provide: SettingService,
          useValue: {
            getSettings: jest.fn(() => ({
              core_nlu_helper: {
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
    defaultNlpHelper = module.get<CoreNluHelper>(CoreNluHelper);
  });

  afterAll(closeInMongodConnection);

  it('should format empty training set properly', async () => {
    const results = await defaultNlpHelper.format([], entitiesMock);
    expect(results).toEqual(nlpEmptyFormated);
  });

  it('should format training set properly', async () => {
    const results = await defaultNlpHelper.format(samplesMock, entitiesMock);
    expect(results).toEqual(nlpFormatted);
  });

  it('should return best guess from empty parse results', async () => {
    const results = await defaultNlpHelper.filterEntitiesByConfidence(
      {
        entities: [],
        intent: { name: 'greeting', confidence: 0 },
        intent_ranking: [],
        text: 'test',
      },
      false,
    );
    expect(results).toEqual({
      entities: [{ entity: 'intent', value: 'greeting', confidence: 0 }],
    });
  });

  it('should return best guess from parse results', async () => {
    const results = await defaultNlpHelper.filterEntitiesByConfidence(
      nlpParseResult,
      false,
    );
    expect(results).toEqual(nlpBestGuess);
  });

  it('should return best guess from parse results with threshold', async () => {
    const results = await defaultNlpHelper.filterEntitiesByConfidence(
      nlpParseResult,
      true,
    );
    const settings = await settingService.getSettings();
    const threshold = settings.core_nlu_helper.threshold;
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
