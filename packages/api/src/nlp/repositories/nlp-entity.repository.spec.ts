/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { TestingModule } from '@nestjs/testing';
import { In } from 'typeorm';

import LlmNluHelper from '@/extensions/helpers/llm-nlu/index.helper';
import { HelperService } from '@/helper/helper.service';
import { SettingService } from '@/setting/services/setting.service';
import { IGNORED_TEST_FIELDS } from '@/utils/test/constants';
import { installNlpValueFixturesTypeOrm } from '@/utils/test/fixtures/nlpvalue';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { NlpEntity } from '../dto/nlp-entity.dto';
import { NlpEntityService } from '../services/nlp-entity.service';
import { NlpService } from '../services/nlp.service';

import { NlpEntityRepository } from './nlp-entity.repository';
import { NlpValueRepository } from './nlp-value.repository';

describe('NlpEntityRepository (TypeORM)', () => {
  let module: TestingModule;
  let nlpEntityRepository: NlpEntityRepository;
  let nlpValueRepository: NlpValueRepository;
  let nlpService: NlpService;
  let llmNluHelper: LlmNluHelper;
  let nlpEntityService: NlpEntityService;
  let firstNameNlpEntity: NlpEntity | null;
  let valueEventEmitter: EventEmitter2;
  let entityEventEmitter: EventEmitter2;

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
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
      typeorm: {
        fixtures: installNlpValueFixturesTypeOrm,
      },
    });

    module = testing.module;

    [nlpEntityRepository, nlpValueRepository, nlpService, nlpEntityService] =
      await testing.getMocks([
        NlpEntityRepository,
        NlpValueRepository,
        NlpService,
        NlpEntityService,
      ]);

    const valueEmitter = nlpValueRepository.getEventEmitter();
    const entityEmitter = nlpEntityRepository.getEventEmitter();
    if (!valueEmitter || !entityEmitter) {
      throw new Error('Event emitters must be defined for repository tests');
    }
    valueEventEmitter = valueEmitter;
    entityEventEmitter = entityEmitter;

    firstNameNlpEntity = await nlpEntityRepository.findOne({
      where: { name: 'firstname' },
    });

    llmNluHelper = module.get(LlmNluHelper);
    module.get(HelperService).register(llmNluHelper);
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

  describe('deleteOne cascade', () => {
    it('should delete a nlp entity and its values', async () => {
      valueEventEmitter.once('hook:nlpEntity:preDelete', async (eventPayload) =>
        nlpService.handleEntityDelete(eventPayload),
      );

      const intentEntity = (await nlpEntityRepository.findOne({
        where: { name: 'intent' },
      }))!;
      const result = await nlpEntityRepository.deleteOne(intentEntity.id);

      expect(result.deletedCount).toEqual(1);

      const intentValues = await nlpValueRepository.find({
        where: { entity: { id: intentEntity.id } },
      });

      expect(intentValues.length).toEqual(0);
    });
  });

  describe('findOneAndPopulate', () => {
    it('should return a nlp entity with populated values', async () => {
      const firstNameValues = await nlpValueRepository.find({
        where: { entity: { id: firstNameNlpEntity!.id } },
      });
      const result = await nlpEntityRepository.findOneAndPopulate(
        firstNameNlpEntity!.id,
      );
      expect(result).toEqualPayload(
        {
          ...firstNameNlpEntity!,
          values: firstNameValues,
        },
        Array.from(IGNORED_TEST_FIELDS),
      );
    });
  });

  describe('findAndPopulate', () => {
    it('should return filtered nlp entities with populated values', async () => {
      const firstNameValues = await nlpValueRepository.find({
        where: { entity: { id: firstNameNlpEntity!.id } },
      });
      const result = await nlpEntityRepository.findAndPopulate({
        where: { id: firstNameNlpEntity!.id },
        order: { name: 'DESC' },
      });
      expect(result).toEqualPayload([
        {
          ...firstNameNlpEntity!,
          values: firstNameValues,
        },
      ]);
    });
  });

  describe('postCreate hook', () => {
    it('should attach a foreignId to the newly created nlp entity', async () => {
      const helperSpy = jest.spyOn(llmNluHelper, 'addEntity');
      const updateSpy = jest.spyOn(nlpEntityService, 'updateOne');

      entityEventEmitter.once(
        'hook:nlpEntity:postCreate',
        async (eventPayload) => {
          await nlpService.handleEntityPostCreate(eventPayload);
        },
      );

      const result = await nlpEntityRepository.create({
        name: 'test-entity',
        lookups: ['keywords'],
      });
      const createdEntity = await nlpEntityRepository.findOne(result.id);

      expect(helperSpy).toHaveBeenCalledTimes(1);
      expect(updateSpy).toHaveBeenCalledWith(result.id, {
        foreignId: await helperSpy.mock.results[0].value,
      });
      expect(createdEntity?.foreignId).toBeDefined();
      expect(createdEntity).toEqualPayload(result, [
        ...IGNORED_TEST_FIELDS,
        'foreignId',
      ]);
    });

    it('should not attach a foreignId when builtin is true', async () => {
      const helperSpy = jest.spyOn(llmNluHelper, 'addEntity');

      entityEventEmitter.once(
        'hook:nlpEntity:postCreate',
        async (eventPayload) => {
          await nlpService.handleEntityPostCreate(eventPayload);
        },
      );

      const result = await nlpEntityRepository.create({
        name: 'builtin-entity',
        builtin: true,
      });
      const createdEntity = await nlpEntityRepository.findOne(result.id);

      expect(helperSpy).not.toHaveBeenCalled();
      expect(createdEntity?.foreignId).toBeUndefined();
      expect(createdEntity).toEqualPayload(result);
    });
  });

  describe('postUpdate hook', () => {
    it('should update a nlp entity and trigger postUpdate', async () => {
      const handleSpy = jest.spyOn(nlpService, 'handleEntityPostUpdate');
      const helperSpy = jest.spyOn(llmNluHelper, 'updateEntity');

      entityEventEmitter.once(
        'hook:nlpEntity:postUpdate',
        async (eventPayload) => {
          await nlpService.handleEntityPostUpdate(eventPayload);
        },
      );

      const updated = await nlpEntityRepository.updateOne(
        firstNameNlpEntity!.id,
        { doc: 'Updated doc' },
      );

      expect(handleSpy).toHaveBeenCalledTimes(1);
      expect(helperSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: updated.name,
        }),
      );
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple nlp entities', async () => {
      const sentiment = await nlpEntityRepository.create({
        name: 'sentiment-test',
      });
      const subject = await nlpEntityRepository.create({
        name: 'subject-test',
      });
      const result = await nlpEntityRepository.deleteMany({
        where: { id: In([sentiment.id, subject.id]) },
      });

      expect(result.deletedCount).toBe(2);
      const remaining = await nlpEntityRepository.find({
        where: { id: In([sentiment.id, subject.id]) },
      });
      expect(remaining.length).toBe(0);
    });
  });
});
