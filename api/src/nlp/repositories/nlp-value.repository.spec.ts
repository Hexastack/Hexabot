/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MongooseModule } from '@nestjs/mongoose';

import LlmNluHelper from '@/extensions/helpers/llm-nlu/index.helper';
import { HelperService } from '@/helper/helper.service';
import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { LanguageModel } from '@/i18n/schemas/language.schema';
import { LanguageService } from '@/i18n/services/language.service';
import { SettingRepository } from '@/setting/repositories/setting.repository';
import { SettingModel } from '@/setting/schemas/setting.schema';
import { SettingSeeder } from '@/setting/seeds/setting.seed';
import { SettingService } from '@/setting/services/setting.service';
import { IGNORED_TEST_FIELDS } from '@/utils/test/constants';
import { nlpEntityFixtures } from '@/utils/test/fixtures/nlpentity';
import { installNlpSampleEntityFixtures } from '@/utils/test/fixtures/nlpsampleentity';
import { nlpValueFixtures } from '@/utils/test/fixtures/nlpvalue';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { TFixtures } from '@/utils/test/types';
import { buildTestingMocks } from '@/utils/test/utils';

import { NlpEntityModel } from '../schemas/nlp-entity.schema';
import { NlpSampleEntityModel } from '../schemas/nlp-sample-entity.schema';
import { NlpSampleModel } from '../schemas/nlp-sample.schema';
import {
  NlpValue,
  NlpValueFull,
  NlpValueModel,
} from '../schemas/nlp-value.schema';
import { NlpEntityService } from '../services/nlp-entity.service';
import { NlpSampleEntityService } from '../services/nlp-sample-entity.service';
import { NlpSampleService } from '../services/nlp-sample.service';
import { NlpValueService } from '../services/nlp-value.service';
import { NlpService } from '../services/nlp.service';

import { NlpEntityRepository } from './nlp-entity.repository';
import { NlpSampleEntityRepository } from './nlp-sample-entity.repository';
import { NlpSampleRepository } from './nlp-sample.repository';
import { NlpValueRepository } from './nlp-value.repository';

describe('NlpValueRepository', () => {
  let nlpValueRepository: NlpValueRepository;
  let nlpSampleEntityRepository: NlpSampleEntityRepository;
  let nlpValues: NlpValue[];
  let nlpService: NlpService;
  let nlpEntityRepository: NlpEntityRepository;
  let llmNluHelper: LlmNluHelper;
  let nlpValueService: NlpValueService;

  beforeAll(async () => {
    const { getMocks, module } = await buildTestingMocks({
      imports: [
        rootMongooseTestModule(installNlpSampleEntityFixtures),
        MongooseModule.forFeature([
          NlpValueModel,
          NlpSampleEntityModel,
          NlpEntityModel,
          LanguageModel,
          SettingModel,
          NlpSampleModel,
        ]),
      ],
      providers: [
        LanguageService,
        LanguageRepository,
        {
          provide: CACHE_MANAGER,
          useValue: {
            set: jest.fn(),
          },
        },
        NlpService,
        NlpSampleService,
        NlpEntityService,
        NlpValueService,
        NlpValueRepository,
        NlpEntityRepository,
        NlpSampleEntityService,
        NlpSampleRepository,
        NlpSampleEntityRepository,
        HelperService,
        {
          provide: SettingService,
          useValue: {
            getSettings: jest.fn(() => ({
              chatbot_settings: {
                default_nlu_helper: 'llm-nlu-helper',
              },
            })),
          },
        },
        SettingRepository,
        SettingSeeder,
        LlmNluHelper,
      ],
    });

    [
      nlpValueRepository,
      nlpSampleEntityRepository,
      nlpService,
      nlpEntityRepository,
      nlpValueService,
    ] = await getMocks([
      NlpValueRepository,
      NlpSampleEntityRepository,
      NlpService,
      NlpEntityRepository,
      NlpValueService,
    ]);
    nlpValues = await nlpValueRepository.findAll();
    llmNluHelper = module.get(LlmNluHelper);
    module.get(HelperService).register(llmNluHelper);
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should return a nlp value with populate', async () => {
      const result = await nlpValueRepository.findOneAndPopulate(
        nlpValues[1].id,
      );
      expect(result).toEqualPayload({
        ...nlpValueFixtures[1],
        entity: nlpEntityFixtures[0],
      });
    });
  });

  describe('findAndPopulate', () => {
    it('should return all nlp values with populate', async () => {
      const pageQuery = getPageQuery<NlpValue>({
        sort: ['createdAt', 'asc'],
      });
      const result = await nlpValueRepository.findAndPopulate({}, pageQuery);
      const nlpValueFixturesWithEntities = nlpValueFixtures.reduce(
        (acc, curr) => {
          const fullValue: NlpValueFull = {
            ...curr,
            entity: nlpEntityFixtures[
              parseInt(curr.entity!)
            ] as NlpValueFull['entity'],
            builtin: curr.builtin!,
            expressions: curr.expressions!,
            metadata: curr.metadata!,
            id: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          acc.push(fullValue);
          return acc;
        },
        [] as TFixtures<NlpValueFull>[],
      );
      expect(result).toEqualPayload(nlpValueFixturesWithEntities, [
        'id',
        'createdAt',
        'updatedAt',
        'metadata',
      ]);
    });
  });

  describe('The deleteCascadeOne function', () => {
    it('should delete a nlp Value', async () => {
      nlpValueRepository.eventEmitter.once(
        'hook:nlpValue:preDelete',
        async (...args) => {
          await nlpService.handleValueDelete(args[0], args[1]);
        },
      );
      const result = await nlpValueRepository.deleteOne(nlpValues[1].id);

      expect(result.deletedCount).toEqual(1);
      const sampleEntities = await nlpSampleEntityRepository.find({
        value: nlpValues[1].id,
      });
      expect(sampleEntities.length).toEqual(0);
    });
  });

  describe('postCreate', () => {
    it('should create and attach a foreign_id to the newly created nlp value', async () => {
      nlpValueRepository.eventEmitter.once(
        'hook:nlpValue:postCreate',
        async (...[created]) => {
          const helperSpy = jest.spyOn(llmNluHelper, 'addValue');
          jest.spyOn(nlpValueService, 'updateOne');
          await nlpService.handleValuePostCreate(created);

          expect(helperSpy).toHaveBeenCalledWith(created);
          expect(nlpValueService.updateOne).toHaveBeenCalledWith(
            {
              _id: created._id,
            },
            { foreign_id: await helperSpy.mock.results[0].value },
          );
        },
      );

      const createdNlpEntity = await nlpEntityRepository.create({
        name: 'test1',
      });

      const result = await nlpValueRepository.create({
        entity: createdNlpEntity.id,
        value: 'test',
      });
      const intentNlpEntity = await nlpValueRepository.findOne(result.id);

      expect(intentNlpEntity?.foreign_id).toBeDefined();
      expect(intentNlpEntity).toEqualPayload(result, [
        ...IGNORED_TEST_FIELDS,
        'foreign_id',
      ]);
    });

    it('should not create and attach a foreign_id to the newly created nlp value with builtin set to true', async () => {
      nlpValueRepository.eventEmitter.once(
        'hook:nlpValue:postCreate',
        async (...[created]) => {
          await nlpService.handleValuePostCreate(created);
        },
      );

      const createdNlpEntity = await nlpEntityRepository.create({
        name: 'nlpEntityTest2',
      });
      const result = await nlpValueRepository.create({
        entity: createdNlpEntity.id,
        value: 'nlpValueTest2',
        builtin: true,
      });
      const nlpValue = await nlpValueRepository.findOne(result.id);

      expect(nlpValue?.foreign_id).toBeUndefined();
      expect(nlpValue).toEqualPayload(result);
    });
  });
});
