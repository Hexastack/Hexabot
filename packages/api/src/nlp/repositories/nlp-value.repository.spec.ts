/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { SettingService } from '@hexabot/setting/services/setting.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TestingModule } from '@nestjs/testing';

import LlmNluHelper from '@/extensions/helpers/llm-nlu/index.helper';
import { HelperService } from '@/helper/helper.service';
import { LanguageOrmEntity } from '@/i18n/entities/language.entity';
import { installNlpSampleEntityFixturesTypeOrm } from '@/utils/test/fixtures/nlpsampleentity';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';
import { Format } from '@/utils/types/format.types';

import { NlpValue, NlpValueFull } from '../dto/nlp-value.dto';
import { NlpEntityOrmEntity } from '../entities/nlp-entity.entity';
import { NlpSampleEntityOrmEntity } from '../entities/nlp-sample-entity.entity';
import { NlpSampleOrmEntity } from '../entities/nlp-sample.entity';
import { NlpValueOrmEntity } from '../entities/nlp-value.entity';
import { NlpValueService } from '../services/nlp-value.service';
import { NlpService } from '../services/nlp.service';

import { NlpEntityRepository } from './nlp-entity.repository';
import { NlpSampleEntityRepository } from './nlp-sample-entity.repository';
import { NlpValueRepository } from './nlp-value.repository';

describe('NlpValueRepository (TypeORM)', () => {
  let module: TestingModule;
  let nlpValueRepository: NlpValueRepository;
  let nlpSampleEntityRepository: NlpSampleEntityRepository;
  let nlpEntityRepository: NlpEntityRepository;
  let nlpService: NlpService;
  let nlpValueService: NlpValueService;
  let llmNluHelper: LlmNluHelper;
  let storedValues: NlpValue[];
  let valueEventEmitter: EventEmitter2;

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [
        NlpValueRepository,
        NlpSampleEntityRepository,
        NlpEntityRepository,
        NlpService,
        NlpValueService,
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
        entities: [
          NlpEntityOrmEntity,
          NlpValueOrmEntity,
          NlpSampleOrmEntity,
          NlpSampleEntityOrmEntity,
          LanguageOrmEntity,
        ],
        fixtures: installNlpSampleEntityFixturesTypeOrm,
      },
    });

    module = testing.module;

    [
      nlpValueRepository,
      nlpSampleEntityRepository,
      nlpEntityRepository,
      nlpService,
      nlpValueService,
    ] = await testing.getMocks([
      NlpValueRepository,
      NlpSampleEntityRepository,
      NlpEntityRepository,
      NlpService,
      NlpValueService,
    ]);

    const emitter = nlpValueRepository.getEventEmitter();
    if (!emitter) {
      throw new Error('Event emitter must be defined for NlpValueRepository');
    }
    valueEventEmitter = emitter;

    storedValues = await nlpValueRepository.findAll();
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

  describe('findOneAndPopulate', () => {
    it('should return a nlp value with its entity populated', async () => {
      const target = storedValues[1];
      const result = await nlpValueRepository.findOneAndPopulate(target.id);

      expect(result).toBeDefined();
      expect(result?.value).toBe(target.value);
      expect(result?.entity).toBeDefined();
      expect(result?.entity).toHaveProperty('name');
    });
  });

  describe('findAndPopulate', () => {
    it('should return all nlp values with entities populated', async () => {
      const result = await nlpValueRepository.findAndPopulate({
        order: { createdAt: 'ASC' },
      });

      expect(result.length).toBe(storedValues.length);
      result.forEach((value) => {
        expect(value.entity).toBeDefined();
      });
    });
  });

  describe('deleteOne', () => {
    it('should delete a value and cascade sample entities', async () => {
      const valueToDelete = storedValues.find(
        (value) => value.value === 'greeting',
      );
      expect(valueToDelete).toBeDefined();

      valueEventEmitter.once('hook:nlpValue:preDelete', async (eventPayload) =>
        nlpService.handleValueDelete(eventPayload),
      );

      const result = await nlpValueRepository.deleteOne(valueToDelete!.id);
      expect(result.deletedCount).toBe(1);

      const remainingSampleLinks = await nlpSampleEntityRepository.find({
        where: { value: { id: valueToDelete!.id } },
      });
      expect(remainingSampleLinks.length).toBe(0);
    });
  });

  describe('postCreate hook', () => {
    it('should attach a foreignId to a newly created value', async () => {
      const helperSpy = jest.spyOn(llmNluHelper, 'addValue');
      const updateSpy = jest.spyOn(nlpValueService, 'updateOne');

      valueEventEmitter.once(
        'hook:nlpValue:postCreate',
        async (eventPayload) => {
          await nlpService.handleValuePostCreate(eventPayload);
        },
      );

      const parentEntity = await nlpEntityRepository.create({
        name: 'value-parent-entity',
      });
      const createdValue = await nlpValueRepository.create({
        entity: parentEntity.id,
        value: 'type-orm-created',
      });
      const stored = await nlpValueRepository.findOne(createdValue.id);

      expect(helperSpy).toHaveBeenCalledTimes(1);
      expect(updateSpy).toHaveBeenCalledWith(createdValue.id, {
        foreignId: await helperSpy.mock.results[0].value,
      });
      expect(stored?.foreignId).toBeDefined();
    });

    it('should skip foreignId when builtin is true', async () => {
      const helperSpy = jest.spyOn(llmNluHelper, 'addValue');

      valueEventEmitter.once(
        'hook:nlpValue:postCreate',
        async (eventPayload) => {
          await nlpService.handleValuePostCreate(eventPayload);
        },
      );

      const parentEntity = await nlpEntityRepository.create({
        name: 'builtin-parent-entity',
      });
      const createdValue = await nlpValueRepository.create({
        entity: parentEntity.id,
        value: 'builtin-value',
        builtin: true,
      });
      const stored = await nlpValueRepository.findOne(createdValue.id);

      expect(helperSpy).not.toHaveBeenCalled();
      expect(stored?.foreignId).toBeUndefined();
    });
  });

  describe('postUpdate hook', () => {
    it('should trigger helper update on value change', async () => {
      const target = storedValues[0];
      const handleSpy = jest.spyOn(nlpService, 'handleValuePostUpdate');
      const helperSpy = jest.spyOn(llmNluHelper, 'updateValue');

      valueEventEmitter.once(
        'hook:nlpValue:postUpdate',
        async (eventPayload) => {
          await nlpService.handleValuePostUpdate(eventPayload);
        },
      );

      await nlpValueRepository.updateOne(target.id, {
        doc: 'Updated documentation',
      });

      expect(handleSpy).toHaveBeenCalledTimes(1);
      expect(helperSpy).toHaveBeenCalled();
    });
  });

  describe('findWithCount', () => {
    it('should return values with sample counts (STUB)', async () => {
      const options = {
        skip: 0,
        take: 10,
        order: { value: 'ASC' as const },
      };
      const values = await nlpValueRepository.findWithCount(
        Format.STUB,
        options,
      );

      expect(values.length).toBeGreaterThan(0);
      values.forEach((value) => {
        expect(value).toHaveProperty('nlpSamplesCount');
      });
    });

    it('should return values with sample counts (FULL)', async () => {
      const options = {
        skip: 0,
        take: 5,
        order: { value: 'ASC' as const },
      };
      const values = await nlpValueRepository.findWithCount(
        Format.FULL,
        options,
      );

      expect(values.length).toBeGreaterThan(0);
      values.forEach((value) => {
        expect(value).toBeInstanceOf(NlpValueFull);
        expect(value.entity).toBeDefined();
        expect(value).toHaveProperty('nlpSamplesCount');
      });
    });
  });
});
