/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import LlmNluHelper from '@/extensions/helpers/llm-nlu/index.helper';
import { HelperService } from '@/helper/helper.service';
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

import { NlpEntity } from '../schemas/nlp-entity.schema';
import { NlpEntityService } from '../services/nlp-entity.service';
import { NlpService } from '../services/nlp.service';

import { NlpEntityRepository } from './nlp-entity.repository';
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
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installNlpValueFixtures)],
      providers: [
        NlpService,
        LlmNluHelper,
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
        async (...[query, criteria]) => {
          await nlpService.handleEntityDelete(query, criteria);
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
      jest.spyOn(nlpService, 'handleEntityPostUpdate');
      jest.spyOn(llmNluHelper, 'updateEntity');

      nlpEntityRepository.eventEmitter.once(
        'hook:nlpEntity:postUpdate',
        async (...[query, updated]) => {
          await nlpService.handleEntityPostUpdate(query, updated);
          expect(llmNluHelper.updateEntity).toHaveBeenCalledWith(updated);
        },
      );

      const updatedNlpEntity = await nlpEntityRepository.updateOne(
        {
          name: 'test2',
        },
        { value: 'test3' },
      );

      expect(nlpService.handleEntityPostUpdate).toHaveBeenCalledTimes(1);
      expect(llmNluHelper.updateEntity).toHaveBeenCalledTimes(1);

      const result = await nlpEntityRepository.findOne(updatedNlpEntity.id);

      expect(result).toEqualPayload(updatedNlpEntity);
    });
  });
});
