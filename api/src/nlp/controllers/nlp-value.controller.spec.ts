/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { LoggerService } from '@/logger/logger.service';
import { nlpEntityFixtures } from '@/utils/test/fixtures/nlpentity';
import {
  installNlpValueFixtures,
  nlpValueFixtures,
} from '@/utils/test/fixtures/nlpvalue';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { TFixtures } from '@/utils/test/types';

import { NlpValueCreateDto } from '../dto/nlp-value.dto';
import { NlpEntityRepository } from '../repositories/nlp-entity.repository';
import { NlpSampleEntityRepository } from '../repositories/nlp-sample-entity.repository';
import { NlpValueRepository } from '../repositories/nlp-value.repository';
import { NlpEntityModel } from '../schemas/nlp-entity.schema';
import { NlpSampleEntityModel } from '../schemas/nlp-sample-entity.schema';
import {
  NlpValue,
  NlpValueFull,
  NlpValueModel,
} from '../schemas/nlp-value.schema';
import { NlpEntityService } from '../services/nlp-entity.service';
import { NlpValueService } from '../services/nlp-value.service';

import { NlpValueController } from './nlp-value.controller';

describe('NlpValueController', () => {
  let nlpValueController: NlpValueController;
  let nlpValueService: NlpValueService;
  let nlpEntityService: NlpEntityService;
  let jhonNlpValue: NlpValue | null;
  let positiveValue: NlpValue | null;
  let negativeValue: NlpValue | null;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NlpValueController],
      imports: [
        rootMongooseTestModule(installNlpValueFixtures),
        MongooseModule.forFeature([
          NlpValueModel,
          NlpSampleEntityModel,
          NlpEntityModel,
        ]),
      ],
      providers: [
        LoggerService,
        NlpValueRepository,
        NlpValueService,
        NlpSampleEntityRepository,
        NlpEntityService,
        NlpEntityRepository,
        EventEmitter2,
      ],
    }).compile();
    nlpValueController = module.get<NlpValueController>(NlpValueController);
    nlpValueService = module.get<NlpValueService>(NlpValueService);
    nlpEntityService = module.get<NlpEntityService>(NlpEntityService);
    jhonNlpValue = await nlpValueService.findOne({ value: 'jhon' });
    positiveValue = await nlpValueService.findOne({ value: 'positive' });
    negativeValue = await nlpValueService.findOne({ value: 'negative' });
  });
  afterAll(async () => {
    await closeInMongodConnection();
  });

  afterEach(jest.clearAllMocks);

  describe('findPage', () => {
    it('should find nlp Values, and foreach nlp value populate the corresponding entity', async () => {
      const pageQuery = getPageQuery<NlpValue>({
        sort: ['value', 'desc'],
      });
      const result = await nlpValueController.findPage(
        pageQuery,
        ['entity'],
        {},
      );

      const nlpValueFixturesWithEntities = nlpValueFixtures.reduce(
        (acc, curr) => {
          acc.push({
            ...curr,
            entity: nlpEntityFixtures[
              parseInt(curr.entity)
            ] as NlpValueFull['entity'],
          });
          return acc;
        },
        [] as TFixtures<NlpValueFull>[],
      );
      expect(result).toEqualPayload(nlpValueFixturesWithEntities);
    });

    it('should find nlp Values', async () => {
      const pageQuery = getPageQuery<NlpValue>({
        sort: ['value', 'desc'],
      });
      const result = await nlpValueController.findPage(
        pageQuery,
        ['invalidCriteria'],
        {},
      );
      const nlpEntities = await nlpEntityService.findAll();
      const nlpValueFixturesWithEntities = nlpValueFixtures.reduce(
        (acc, curr) => {
          const ValueWithEntities = {
            ...curr,
            entity: nlpEntities[parseInt(curr.entity)].id,
          };
          acc.push(ValueWithEntities);
          return acc;
        },
        [] as TFixtures<NlpValue>[],
      );
      expect(result).toEqualPayload(nlpValueFixturesWithEntities);
    });
  });

  describe('count', () => {
    it('should count the nlp Values', async () => {
      const result = await nlpValueController.filterCount();
      const count = nlpValueFixtures.length;
      expect(result).toEqual({ count });
    });
  });

  describe('create', () => {
    it('should create nlp Value', async () => {
      const nlpEntities = await nlpEntityService.findAll();
      const value: NlpValueCreateDto = {
        entity: nlpEntities[0].id,
        value: 'valuetest',
        expressions: ['synonym1', 'synonym2'],
        metadata: { firstkey: 'firstvalue', secondKey: 1995 },
        builtin: false,
      };
      const result = await nlpValueController.create(value);
      expect(result).toEqualPayload(value);
    });
  });

  describe('deleteOne', () => {
    it('should delete a nlp Value', async () => {
      const result = await nlpValueController.deleteOne(jhonNlpValue!.id);
      expect(result.deletedCount).toEqual(1);
    });

    it('should throw exception when nlp Value id not found', async () => {
      await expect(
        nlpValueController.deleteOne(jhonNlpValue!.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should get a nlp Value', async () => {
      const result = await nlpValueController.findOne(positiveValue!.id, [
        'invalidCreteria',
      ]);
      const intentNlpEntity = await nlpEntityService.findOne({
        name: 'intent',
      });
      const valueWithEntity = {
        ...nlpValueFixtures[0],
        entity: intentNlpEntity!.id,
      };

      expect(result).toEqualPayload(valueWithEntity);
    });

    it('should get a nlp Value with populate', async () => {
      const intentNlpEntity = await nlpEntityService.findOne({
        name: 'intent',
      });
      const result = await nlpValueController.findOne(positiveValue!.id, [
        'entity',
      ]);
      const valueWithEntity = {
        ...nlpValueFixtures[0],
        entity: intentNlpEntity,
      };
      expect(result).toEqualPayload(valueWithEntity);
    });

    it('should throw NotFoundException when Id does not exist', async () => {
      await expect(
        nlpValueController.findOne(jhonNlpValue!.id, ['entity']),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOne', () => {
    it('should update a nlp Value', async () => {
      const intentNlpEntity = await nlpEntityService.findOne({
        name: 'intent',
      });
      const updatedValue = {
        entity: intentNlpEntity!.id,
        value: 'updated',
        expressions: [],
        builtin: true,
      };
      const result = await nlpValueController.updateOne(
        positiveValue!.id,
        updatedValue,
      );
      expect(result).toEqualPayload(updatedValue);
    });

    it('should throw exception when nlp value id not found', async () => {
      const intentNlpEntity = await nlpEntityService.findOne({
        name: 'intent',
      });
      await expect(
        nlpValueController.updateOne(jhonNlpValue!.id, {
          entity: intentNlpEntity!.id,
          value: 'updated',
          expressions: [],
          builtin: true,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
  describe('deleteMany', () => {
    it('should delete multiple nlp values', async () => {
      const valuesToDelete = [positiveValue!.id, negativeValue!.id];

      const result = await nlpValueController.deleteMany(valuesToDelete);

      expect(result.deletedCount).toEqual(valuesToDelete.length);
      const remainingValues = await nlpValueService.find({
        _id: { $in: valuesToDelete },
      });
      expect(remainingValues.length).toBe(0);
    });

    it('should throw BadRequestException when no IDs are provided', async () => {
      await expect(nlpValueController.deleteMany([])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when provided IDs do not exist', async () => {
      const nonExistentIds = [
        '614c1b2f58f4f04c876d6b8d',
        '614c1b2f58f4f04c876d6b8e',
      ];

      await expect(
        nlpValueController.deleteMany(nonExistentIds),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
