/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FindManyOptions, In } from 'typeorm';

import {
  installNlpValueFixturesTypeOrm,
  nlpValueFixtures,
} from '@hexabot/dev/fixtures/nlpvalue';
import { closeTypeOrmConnections } from '@hexabot/dev/test';
import { buildTestingMocks } from '@hexabot/dev/utils';
import { Format } from '@/utils/types/format.types';

import { NlpValue } from '../dto/nlp-value.dto';
import { NlpEntityOrmEntity } from '../entities/nlp-entity.entity';
import { NlpSampleEntityOrmEntity } from '../entities/nlp-sample-entity.entity';
import { NlpSampleOrmEntity } from '../entities/nlp-sample.entity';
import { NlpValueOrmEntity } from '../entities/nlp-value.entity';
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
    const testing = await buildTestingMocks({
      autoInjectFrom: ['controllers', 'providers'],
      controllers: [NlpValueController],
      providers: [NlpValueService, NlpEntityService],
      typeorm: {
        entities: [
          NlpValueOrmEntity,
          NlpEntityOrmEntity,
          NlpSampleOrmEntity,
          NlpSampleEntityOrmEntity,
        ],
        fixtures: installNlpValueFixturesTypeOrm,
      },
    });
    [nlpValueController, nlpValueService, nlpEntityService] =
      await testing.getMocks([
        NlpValueController,
        NlpValueService,
        NlpEntityService,
      ]);
    jhonNlpValue = await nlpValueService.findOne({ where: { value: 'jhon' } });
    positiveValue = await nlpValueService.findOne({
      where: { value: 'positive' },
    });
    negativeValue = await nlpValueService.findOne({
      where: { value: 'negative' },
    });
  });

  afterAll(async () => {
    await closeTypeOrmConnections();
  });

  afterEach(jest.clearAllMocks);

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
      const result = await nlpValueController.create({
        entity: nlpEntities[0].id,
        value: 'valuetest',
        expressions: ['synonym1', 'synonym2'],
        metadata: {},
        builtin: false,
        doc: '',
      });
      expect(result).toEqualPayload(
        {
          entity: nlpEntities[0].id,
          value: 'valuetest',
          expressions: ['synonym1', 'synonym2'],
          metadata: {},
          builtin: false,
          doc: '',
        },
        ['id', 'createdAt', 'updatedAt', 'foreignId', 'metadata'],
      );
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
        where: { name: 'intent' },
      });
      expect(result).toEqualPayload(
        {
          ...nlpValueFixtures[0],
          entity: intentNlpEntity!.id,
        },
        ['id', 'createdAt', 'updatedAt', 'foreignId', 'metadata'],
      );
    });

    it('should get a nlp Value with populate', async () => {
      const intentNlpEntity = await nlpEntityService.findOne({
        where: { name: 'intent' },
      });
      const result = await nlpValueController.findOne(positiveValue!.id, [
        'entity',
      ]);
      const valueWithEntity = {
        ...nlpValueFixtures[0],
        entity: intentNlpEntity,
      };
      expect(result).toEqualPayload(valueWithEntity, [
        'id',
        'createdAt',
        'updatedAt',
        'foreignId',
        'metadata',
      ]);
    });

    it('should throw NotFoundException when Id does not exist', async () => {
      await expect(
        nlpValueController.findOne(jhonNlpValue!.id, ['entity']),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOne', () => {
    it('should update a nlp Value', async () => {
      const intentNlpEntity = (await nlpEntityService.findOne({
        where: { name: 'intent' },
      }))!;
      const result = await nlpValueController.updateOne(positiveValue!.id, {
        entity: intentNlpEntity!.id,
        value: 'updated',
        expressions: [],
        builtin: false,
        doc: '',
      });
      expect(result).toEqualPayload(
        {
          entity: intentNlpEntity!.id,
          value: 'updated',
          expressions: [],
          builtin: false,
          doc: '',
        },
        ['id', 'createdAt', 'updatedAt', 'foreignId', 'metadata'],
      );
    });

    it('should throw exception when nlp value id not found', async () => {
      const intentNlpEntity = await nlpEntityService.findOne({
        where: { name: 'intent' },
      });
      await expect(
        nlpValueController.updateOne(jhonNlpValue!.id, {
          entity: intentNlpEntity!.id,
          value: 'updated',
          expressions: [],
          builtin: true,
          doc: '',
        }),
      ).rejects.toThrow('Unable to execute updateOne() - No updates');
    });
  });
  describe('deleteMany', () => {
    it('should delete multiple nlp values', async () => {
      const valuesToDelete = [positiveValue!.id, negativeValue!.id];
      const result = await nlpValueController.deleteMany(valuesToDelete);

      expect(result.deletedCount).toEqual(valuesToDelete.length);
      const remainingValues = await nlpValueService.find({
        where: { id: In(valuesToDelete) },
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
        '2f8f1d3d-6a84-4c54-9b4b-7a5d2c3b0001',
        '2f8f1d3d-6a84-4c54-9b4b-7a5d2c3b0002',
      ];

      await expect(
        nlpValueController.deleteMany(nonExistentIds),
      ).rejects.toThrow(NotFoundException);
    });
  });
  describe('findWithCount', () => {
    it('should call service with correct format based on populate', async () => {
      jest.spyOn(nlpValueService, 'findWithCount');

      const options: FindManyOptions<NlpValueOrmEntity> = {
        skip: 0,
        take: 10,
        order: { value: 'ASC' },
      };

      await nlpValueController.findWithCount(['entity'], options);

      expect(nlpValueService.findWithCount).toHaveBeenCalledWith(
        Format.FULL,
        options,
      );
    });
  });
});
