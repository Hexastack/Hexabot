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
import { installNlpValueFixtures } from '@/utils/test/fixtures/nlpvalue';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { NlpEntity, NlpEntityModel } from '../schemas/nlp-entity.schema';
import { NlpSampleEntityModel } from '../schemas/nlp-sample-entity.schema';
import { NlpSampleModel } from '../schemas/nlp-sample.schema';
import { NlpValueModel } from '../schemas/nlp-value.schema';
import { NlpEntityService } from '../services/nlp-entity.service';
import { NlpSampleEntityService } from '../services/nlp-sample-entity.service';
import { NlpSampleService } from '../services/nlp-sample.service';
import { NlpValueService } from '../services/nlp-value.service';
import { NlpService } from '../services/nlp.service';

import { NlpEntityRepository } from './nlp-entity.repository';
import { NlpSampleEntityRepository } from './nlp-sample-entity.repository';
import { NlpSampleRepository } from './nlp-sample.repository';
import { NlpValueRepository } from './nlp-value.repository';

describe('NlpEntityRepository', () => {
  let nlpEntityRepository: NlpEntityRepository;
  let nlpValueRepository: NlpValueRepository;
  let firstNameNlpEntity: NlpEntity | null;
  let nlpService: NlpService;
  let llmNluHelper: LlmNluHelper;
  let nlpEntityService: NlpEntityService;

  beforeAll(async () => {
    const { getMocks, module } = await buildTestingMocks({
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
        HelperService,
        NlpEntityRepository,
        NlpValueRepository,
        NlpSampleEntityRepository,
        NlpService,
        NlpSampleService,
        NlpEntityService,
        NlpValueService,
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        NlpSampleEntityService,
        NlpSampleRepository,
        LanguageService,
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
        LanguageRepository,
        SettingRepository,
        SettingSeeder,
        LlmNluHelper,
      ],
    });

    [nlpEntityRepository, nlpValueRepository, nlpService, nlpEntityService] =
      await getMocks([
        NlpEntityRepository,
        NlpValueRepository,
        NlpService,
        NlpEntityService,
      ]);
    firstNameNlpEntity = await nlpEntityRepository.findOne({
      name: 'firstname',
    });
    llmNluHelper = module.get(LlmNluHelper);
    module.get(HelperService).register(llmNluHelper);
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('The deleteCascadeOne function', () => {
    it('should delete a nlp entity', async () => {
      nlpValueRepository.eventEmitter.once(
        'hook:nlpEntity:preDelete',
        async (...args) => {
          await nlpService.handleEntityDelete(args[0], args[1]);
        },
      );
      const intentNlpEntity = await nlpEntityRepository.findOne({
        name: 'intent',
      });
      const result = await nlpEntityRepository.deleteOne(intentNlpEntity!.id);

      expect(result.deletedCount).toEqual(1);

      const intentNlpValues = await nlpValueRepository.find({
        entity: intentNlpEntity!.id,
      });

      expect(intentNlpValues.length).toEqual(0);
    });
  });

  describe('findOneAndPopulate', () => {
    it('should return a nlp entity with populate', async () => {
      const firstNameValues = await nlpValueRepository.find({
        entity: firstNameNlpEntity!.id,
      });
      const result = await nlpEntityRepository.findOneAndPopulate(
        firstNameNlpEntity!.id,
      );
      expect(result).toEqualPayload({
        ...nlpEntityFixtures[1],
        values: firstNameValues,
      });
    });
  });

  describe('findAndPopulate', () => {
    it('should return all nlp entities with populate', async () => {
      const pageQuery = getPageQuery<NlpEntity>({
        sort: ['name', 'desc'],
      });
      const firstNameValues = await nlpValueRepository.find({
        entity: firstNameNlpEntity!.id,
      });
      const result = await nlpEntityRepository.findAndPopulate(
        { _id: firstNameNlpEntity!.id },
        pageQuery,
      );
      expect(result).toEqualPayload([
        {
          id: firstNameNlpEntity!.id,
          ...nlpEntityFixtures[1],
          values: firstNameValues,
        },
      ]);
    });
  });

  describe('postCreate', () => {
    it('should create and attach a foreign_id to the newly created nlp entity', async () => {
      nlpEntityRepository.eventEmitter.once(
        'hook:nlpEntity:postCreate',
        async (...[created]) => {
          const helperSpy = jest.spyOn(llmNluHelper, 'addEntity');
          jest.spyOn(nlpEntityService, 'updateOne');
          await nlpService.handleEntityPostCreate(created);

          expect(helperSpy).toHaveBeenCalledWith(created);
          expect(nlpEntityService.updateOne).toHaveBeenCalledWith(
            {
              _id: created._id,
            },
            { foreign_id: await helperSpy.mock.results[0].value },
          );
        },
      );

      const result = await nlpEntityRepository.create({
        name: 'test1',
      });
      const intentNlpEntity = await nlpEntityRepository.findOne(result.id);

      expect(intentNlpEntity?.foreign_id).toBeDefined();
      expect(intentNlpEntity).toEqualPayload(result, [
        ...IGNORED_TEST_FIELDS,
        'foreign_id',
      ]);
    });

    it('should not create and attach a foreign_id to the newly created nlp entity with builtin set to true', async () => {
      nlpEntityRepository.eventEmitter.once(
        'hook:nlpEntity:postCreate',
        async (...[created]) => {
          await nlpService.handleEntityPostCreate(created);
        },
      );

      const result = await nlpEntityRepository.create({
        name: 'test2',
        builtin: true,
      });
      const nlpEntity = await nlpEntityRepository.findOne(result.id);

      expect(nlpEntity?.foreign_id).toBeUndefined();
      expect(nlpEntity).toEqualPayload(result);
    });
  });

  describe('postUpdate', () => {
    it('should update an NlpEntity and trigger a postUpdate event', async () => {
      nlpEntityRepository.eventEmitter.once(
        'hook:nlpEntity:postUpdate',
        async (...[query, updated]) => {
          const spy1 = jest.spyOn(llmNluHelper, 'updateEntity');
          await nlpService.handleEntityPostUpdate(query, updated);

          expect(spy1).toHaveBeenCalledWith(updated);
        },
      );

      const updatedNlpEntity = await nlpEntityRepository.updateOne(
        {
          name: 'test2',
        },
        { value: 'test3' },
      );
      const result = await nlpEntityRepository.findOne(updatedNlpEntity.id);

      expect(result).toEqualPayload(updatedNlpEntity);
    });
  });
});
