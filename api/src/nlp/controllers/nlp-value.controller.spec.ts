/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { getUpdateOneError } from '@/utils/test/errors/messages';
import {
  installNlpValueFixtures,
  nlpValueFixtures,
} from '@/utils/test/fixtures/nlpvalue';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';
import { TFilterQuery } from '@/utils/types/filter.types';
import { Format } from '@/utils/types/format.types';

import { NlpValueCreateDto } from '../dto/nlp-value.dto';
import { NlpValue } from '../schemas/nlp-value.schema';
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
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['controllers'],
      controllers: [NlpValueController],
      imports: [rootMongooseTestModule(installNlpValueFixtures)],
    });
    [nlpValueController, nlpValueService, nlpEntityService] = await getMocks([
      NlpValueController,
      NlpValueService,
      NlpEntityService,
    ]);
    jhonNlpValue = await nlpValueService.findOne({ value: 'jhon' });
    positiveValue = await nlpValueService.findOne({ value: 'positive' });
    negativeValue = await nlpValueService.findOne({ value: 'negative' });
  });

  afterAll(closeInMongodConnection);

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
      const value: NlpValueCreateDto = {
        entity: nlpEntities[0].id,
        value: 'valuetest',
        expressions: ['synonym1', 'synonym2'],
        metadata: {},
        builtin: false,
        doc: '',
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
        builtin: false,
        doc: '',
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
          doc: '',
        }),
      ).rejects.toThrow(getUpdateOneError(NlpValue.name, jhonNlpValue!.id));
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
  describe('findWithCount', () => {
    it('should call service with correct format based on populate', async () => {
      jest.spyOn(nlpValueService, 'findWithCount');

      const filters: TFilterQuery<NlpValue> = {};
      const pageQuery: PageQueryDto<NlpValue> = {
        limit: 10,
        skip: 0,
        sort: ['value', 'asc'],
      };

      await nlpValueController.findWithCount(pageQuery, ['entity'], filters);

      expect(nlpValueService.findWithCount).toHaveBeenCalledWith(
        Format.FULL,
        pageQuery,
        filters,
      );
    });
  });
});
