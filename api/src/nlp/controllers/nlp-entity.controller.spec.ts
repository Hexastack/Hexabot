/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { MethodNotAllowedException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { LoggerService } from '@/logger/logger.service';
import { IGNORED_TEST_FIELDS } from '@/utils/test/constants';
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

import { NlpEntityController } from './nlp-entity.controller';
import { NlpEntityCreateDto } from '../dto/nlp-entity.dto';
import { NlpEntityRepository } from '../repositories/nlp-entity.repository';
import { NlpSampleEntityRepository } from '../repositories/nlp-sample-entity.repository';
import { NlpValueRepository } from '../repositories/nlp-value.repository';
import {
  NlpEntityModel,
  NlpEntity,
  NlpEntityFull,
} from '../schemas/nlp-entity.schema';
import { NlpSampleEntityModel } from '../schemas/nlp-sample-entity.schema';
import { NlpValueModel } from '../schemas/nlp-value.schema';
import { NlpEntityService } from '../services/nlp-entity.service';
import { NlpValueService } from '../services/nlp-value.service';

describe('NlpEntityController', () => {
  let nlpEntityController: NlpEntityController;
  let nlpValueService: NlpValueService;
  let nlpEntityService: NlpEntityService;
  let intentEntityId: string;
  let buitInEntityId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NlpEntityController],
      imports: [
        rootMongooseTestModule(installNlpValueFixtures),
        MongooseModule.forFeature([
          NlpEntityModel,
          NlpSampleEntityModel,
          NlpValueModel,
        ]),
      ],
      providers: [
        LoggerService,
        NlpEntityService,
        NlpEntityRepository,
        NlpValueService,
        NlpSampleEntityRepository,
        NlpValueRepository,
        EventEmitter2,
      ],
    }).compile();
    nlpEntityController = module.get<NlpEntityController>(NlpEntityController);
    nlpValueService = module.get<NlpValueService>(NlpValueService);
    nlpEntityService = module.get<NlpEntityService>(NlpEntityService);

    intentEntityId = (
      await nlpEntityService.findOne({
        name: 'intent',
      })
    ).id;
    buitInEntityId = (
      await nlpEntityService.findOne({
        name: 'built_in',
      })
    ).id;
  });
  afterAll(async () => {
    await closeInMongodConnection();
  });

  afterEach(jest.clearAllMocks);

  describe('findPage', () => {
    it('should find nlp entities,and foreach nlp entity, populate the corresponding values', async () => {
      const pageQuery = getPageQuery<NlpEntity>({ sort: ['name', 'desc'] });
      const result = await nlpEntityController.findPage(
        pageQuery,
        ['values'],
        {},
      );
      const entitiesWithValues = nlpEntityFixtures.reduce(
        (acc, curr, index) => {
          acc.push({
            ...curr,
            values: nlpValueFixtures.filter(
              ({ entity }) => parseInt(entity) === index,
            ),
          });
          return acc;
        },
        [],
      );
      expect(result).toEqualPayload(
        entitiesWithValues.sort((a, b) => {
          if (a.name > b.name) {
            return -1;
          }
          if (a.name < b.name) {
            return 1;
          }
          return 0;
        }),
        [...IGNORED_TEST_FIELDS, 'entity'],
      );
    });

    it('should find nlp entities', async () => {
      const pageQuery = getPageQuery<NlpEntity>({ sort: ['name', 'desc'] });
      const result = await nlpEntityController.findPage(
        pageQuery,
        ['invalidCriteria'],
        {},
      );
      expect(result).toEqualPayload(
        nlpEntityFixtures.sort((a, b) => {
          if (a.name > b.name) {
            return -1;
          }
          if (a.name < b.name) {
            return 1;
          }
          return 0;
        }),
      );
    });
  });

  describe('count', () => {
    it('should count the nlp entities', async () => {
      const result = await nlpEntityController.filterCount();
      const count = nlpEntityFixtures.length;
      expect(result).toEqual({ count });
    });
  });

  describe('create', () => {
    it('should create nlp entity', async () => {
      const sentimentEntity: NlpEntityCreateDto = {
        name: 'sentiment',
        lookups: ['trait'],
        builtin: false,
      };
      const result = await nlpEntityController.create(sentimentEntity);
      expect(result).toEqualPayload(sentimentEntity);
    });
  });

  describe('deleteOne', () => {
    it('should delete a nlp entity', async () => {
      const result = await nlpEntityController.deleteOne(intentEntityId);
      expect(result.deletedCount).toEqual(1);
    });

    it('should throw exception when nlp entity id not found', async () => {
      await expect(
        nlpEntityController.deleteOne(intentEntityId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw exception when nlp entity is builtin', async () => {
      await expect(
        nlpEntityController.deleteOne(buitInEntityId),
      ).rejects.toThrow(MethodNotAllowedException);
    });
  });

  describe('findOne', () => {
    it('should find a nlp entity', async () => {
      const firstNameEntity = await nlpEntityService.findOne({
        name: 'first_name',
      });
      const result = await nlpEntityController.findOne(firstNameEntity.id, []);

      expect(result).toEqualPayload(
        nlpEntityFixtures.find(({ name }) => name === 'first_name'),
      );
    });

    it('should find a nlp entity, and populate its values', async () => {
      const firstNameEntity = await nlpEntityService.findOne({
        name: 'first_name',
      });
      const firstNameValues = await nlpValueService.findOne({ value: 'jhon' });
      const firstNameWithValues: NlpEntityFull = {
        ...firstNameEntity,
        values: [firstNameValues],
      };
      const result = await nlpEntityController.findOne(firstNameEntity.id, [
        'values',
      ]);
      expect(result).toEqualPayload(firstNameWithValues);
    });

    it('should throw NotFoundException when Id does not exist', async () => {
      await expect(
        nlpEntityController.findOne(intentEntityId, ['values']),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOne', () => {
    it('should update a nlp entity', async () => {
      const firstNameEntity = await nlpEntityService.findOne({
        name: 'first_name',
      });
      const updatedNlpEntity: NlpEntityCreateDto = {
        name: 'updated',
        doc: '',
        lookups: ['trait'],
        builtin: false,
      };
      const result = await nlpEntityController.updateOne(
        firstNameEntity.id,
        updatedNlpEntity,
      );
      expect(result).toEqualPayload(updatedNlpEntity);
    });

    it('should throw exception when nlp entity id not found', async () => {
      const updateNlpEntity: NlpEntityCreateDto = {
        name: 'updated',
        doc: '',
        lookups: ['trait'],
        builtin: false,
      };
      await expect(
        nlpEntityController.updateOne(intentEntityId, updateNlpEntity),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw exception when nlp entity is builtin', async () => {
      const updateNlpEntity: NlpEntityCreateDto = {
        name: 'updated',
        doc: '',
        lookups: ['trait'],
        builtin: false,
      };
      await expect(
        nlpEntityController.updateOne(buitInEntityId, updateNlpEntity),
      ).rejects.toThrow(MethodNotAllowedException);
    });
  });
});
