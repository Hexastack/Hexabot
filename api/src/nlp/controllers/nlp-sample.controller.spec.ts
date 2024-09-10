/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import fs from 'fs';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { ExtendedI18nService } from '@/extended-i18n.service';
import { LoggerService } from '@/logger/logger.service';
import { SettingRepository } from '@/setting/repositories/setting.repository';
import { SettingModel } from '@/setting/schemas/setting.schema';
import { SettingSeeder } from '@/setting/seeds/setting.seed';
import { SettingService } from '@/setting/services/setting.service';
import { installAttachmentFixtures } from '@/utils/test/fixtures/attachment';
import { nlpSampleFixtures } from '@/utils/test/fixtures/nlpsample';
import { installNlpSampleEntityFixtures } from '@/utils/test/fixtures/nlpsampleentity';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { NlpSampleController } from './nlp-sample.controller';
import { NlpSampleDto } from '../dto/nlp-sample.dto';
import { NlpEntityRepository } from '../repositories/nlp-entity.repository';
import { NlpSampleEntityRepository } from '../repositories/nlp-sample-entity.repository';
import { NlpSampleRepository } from '../repositories/nlp-sample.repository';
import { NlpValueRepository } from '../repositories/nlp-value.repository';
import { NlpEntityModel } from '../schemas/nlp-entity.schema';
import { NlpSampleEntityModel } from '../schemas/nlp-sample-entity.schema';
import { NlpSample, NlpSampleModel } from '../schemas/nlp-sample.schema';
import { NlpValueModel } from '../schemas/nlp-value.schema';
import { NlpSampleState } from '../schemas/types';
import { NlpEntityService } from '../services/nlp-entity.service';
import { NlpSampleEntityService } from '../services/nlp-sample-entity.service';
import { NlpSampleService } from '../services/nlp-sample.service';
import { NlpValueService } from '../services/nlp-value.service';
import { NlpService } from '../services/nlp.service';

describe('NlpSampleController', () => {
  let nlpSampleController: NlpSampleController;
  let nlpSampleEntityService: NlpSampleEntityService;
  let nlpSampleService: NlpSampleService;
  let nlpEntityService: NlpEntityService;
  let nlpValueService: NlpValueService;
  let attachmentService: AttachmentService;
  let byeJhonSampleId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NlpSampleController],
      imports: [
        rootMongooseTestModule(async () => {
          await installNlpSampleEntityFixtures();
          await installAttachmentFixtures();
        }),
        MongooseModule.forFeature([
          NlpSampleModel,
          NlpSampleEntityModel,
          AttachmentModel,
          NlpEntityModel,
          NlpValueModel,
          SettingModel,
        ]),
      ],
      providers: [
        LoggerService,
        NlpSampleRepository,
        NlpSampleEntityRepository,
        AttachmentService,
        NlpEntityService,
        AttachmentRepository,
        NlpEntityRepository,
        NlpValueService,
        NlpValueRepository,
        NlpSampleService,
        NlpSampleEntityService,
        EventEmitter2,
        NlpService,
        SettingRepository,
        SettingService,
        SettingSeeder,
        {
          provide: ExtendedI18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
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
    nlpSampleController = module.get<NlpSampleController>(NlpSampleController);
    nlpSampleEntityService = module.get<NlpSampleEntityService>(
      NlpSampleEntityService,
    );
    nlpSampleService = module.get<NlpSampleService>(NlpSampleService);
    nlpEntityService = module.get<NlpEntityService>(NlpEntityService);
    nlpValueService = module.get<NlpValueService>(NlpValueService);
    byeJhonSampleId = (
      await nlpSampleService.findOne({
        text: 'Bye Jhon',
      })
    ).id;
    attachmentService = module.get<AttachmentService>(AttachmentService);
  });
  afterAll(async () => {
    await closeInMongodConnection();
  });

  afterEach(jest.clearAllMocks);

  describe('findPage', () => {
    it('should find nlp samples, and foreach sample populate the corresponding entities', async () => {
      const pageQuery = getPageQuery<NlpSample>({ sort: ['text', 'desc'] });
      const result = await nlpSampleController.findPage(
        pageQuery,
        ['entities'],
        {},
      );
      const nlpSamples = await nlpSampleService.findAll();
      const nlpSampleEntities = await nlpSampleEntityService.findAll();
      const nlpSampleFixturesWithEntities = nlpSamples.reduce(
        (acc, currSample) => {
          const sampleWithEntities = {
            ...currSample,
            entities: nlpSampleEntities.filter((currSampleEntity) => {
              return currSampleEntity.sample === currSample.id;
            }),
          };
          acc.push(sampleWithEntities);
          return acc;
        },
        [],
      );

      expect(result).toEqualPayload(nlpSampleFixturesWithEntities);
    });

    it('should find nlp samples', async () => {
      const pageQuery = getPageQuery<NlpSample>({ sort: ['text', 'desc'] });
      const result = await nlpSampleController.findPage(
        pageQuery,
        ['invalidCriteria'],
        {},
      );
      expect(result).toEqualPayload(nlpSampleFixtures);
    });
  });

  describe('count', () => {
    it('should count the nlp samples', async () => {
      const result = await nlpSampleController.count({});
      const count = nlpSampleFixtures.length;
      expect(result).toEqual({ count });
    });
  });

  describe('create', () => {
    it('should create nlp sample', async () => {
      const nlSample: NlpSampleDto = {
        text: 'text1',
        trained: true,
        type: NlpSampleState.test,
        entities: [],
      };
      const result = await nlpSampleController.create(nlSample);
      expect(result).toEqualPayload(nlSample);
    });
  });

  describe('deleteOne', () => {
    it('should delete a nlp sample', async () => {
      const result = await nlpSampleController.deleteOne(byeJhonSampleId);
      expect(result.deletedCount).toEqual(1);
    });

    it('should throw exception when nlp sample id not found', async () => {
      await expect(
        nlpSampleController.deleteOne(byeJhonSampleId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should find a nlp sample', async () => {
      const yessSample = await nlpSampleService.findOne({
        text: 'yess',
      });
      const result = await nlpSampleController.findOne(yessSample.id, [
        'invalidCreteria',
      ]);
      expect(result).toEqualPayload(nlpSampleFixtures[0]);
    });

    it('should find a nlp sample and populate its entities', async () => {
      const yessSample = await nlpSampleService.findOne({
        text: 'yess',
      });
      const yessSampleEntity = await nlpSampleEntityService.findOne({
        sample: yessSample.id,
      });
      const result = await nlpSampleController.findOne(yessSample.id, [
        'entities',
      ]);
      const samplesWithEntities = {
        ...nlpSampleFixtures[0],
        entities: [yessSampleEntity],
      };
      expect(result).toEqualPayload(samplesWithEntities);
    });

    it('should throw NotFoundException when Id does not exist', async () => {
      await expect(
        nlpSampleController.findOne(byeJhonSampleId, ['entities']),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOne', () => {
    it('should update a nlp sample', async () => {
      const yessSample = await nlpSampleService.findOne({
        text: 'yess',
      });
      const result = await nlpSampleController.updateOne(yessSample.id, {
        text: 'updated',
        trained: true,
        type: NlpSampleState.test,
        entities: [
          {
            entity: 'intent',
            value: 'update',
          },
        ],
      });
      const updatedSample = {
        text: 'updated',
        trained: false,
        type: NlpSampleState.test,
        entities: [
          {
            entity: expect.stringMatching(/^[a-z0-9]+$/),
            sample: expect.stringMatching(/^[a-z0-9]+$/),
            value: expect.stringMatching(/^[a-z0-9]+$/),
          },
        ],
      };
      expect(result.text).toEqual(updatedSample.text);
      expect(result.type).toEqual(updatedSample.type);
      expect(result.trained).toEqual(updatedSample.trained);
      expect(result.entities).toMatchObject(updatedSample.entities);
    });

    it('should throw exception when nlp sample id not found', async () => {
      await expect(
        nlpSampleController.updateOne(byeJhonSampleId, {
          text: 'updated',
          trained: true,
          type: NlpSampleState.test,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('import', () => {
    it('should throw exception when attachment is not found', async () => {
      const invalidattachmentId = (
        await attachmentService.findOne({
          name: 'store2.jpg',
        })
      ).id;
      await attachmentService.deleteOne({ name: 'store2.jpg' });
      await expect(
        nlpSampleController.import(invalidattachmentId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw exception when file location is not present', async () => {
      const attachmentId = (
        await attachmentService.findOne({
          name: 'store1.jpg',
        })
      ).id;
      jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false);
      await expect(nlpSampleController.import(attachmentId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return a failure if an error occurs when parsing csv file ', async () => {
      const mockCsvDataWithErrors: string = `intent,entities,lang,question
          greeting,person,en`;
      jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(mockCsvDataWithErrors);
      const attachmentId = (
        await attachmentService.findOne({
          name: 'store1.jpg',
        })
      ).id;

      const mockParsedCsvDataWithErrors = {
        data: [{ intent: 'greeting', entities: 'person', lang: 'en' }],
        errors: [
          {
            type: 'FieldMismatch',
            code: 'TooFewFields',
            message: 'Too few fields: expected 4 fields but parsed 3',
            row: 0,
          },
        ],
        meta: {
          delimiter: ',',
          linebreak: '\n',
          aborted: false,
          truncated: false,
          cursor: 49,
          fields: ['intent', 'entities', 'lang', 'question'],
        },
      };
      await expect(nlpSampleController.import(attachmentId)).rejects.toThrow(
        new BadRequestException({
          cause: mockParsedCsvDataWithErrors.errors,
          description: 'Error while parsing CSV',
        }),
      );
    });

    it('should import data from a CSV file', async () => {
      const attachmentId = (
        await attachmentService.findOne({
          name: 'store1.jpg',
        })
      ).id;
      const mockCsvData: string = [
        `text,intent,language`,
        `Was kostet dieser bmw,preis,de`,
      ].join('\n');
      jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(mockCsvData);

      const result = await nlpSampleController.import(attachmentId);
      const intentEntityResult = await nlpEntityService.findOne({
        name: 'intent',
      });
      const languageEntityResult = await nlpEntityService.findOne({
        name: 'language',
      });
      const preisValueResult = await nlpValueService.findOne({
        value: 'preis',
      });
      const deValueResult = await nlpValueService.findOne({
        value: 'de',
      });
      const textSampleResult = await nlpSampleService.findOne({
        text: 'Was kostet dieser bmw',
      });
      const intentEntity = {
        name: 'intent',
        lookups: ['trait'],
        doc: '',
        builtin: false,
      };
      const languageEntity = {
        name: 'language',
        lookups: ['trait'],
        builtin: false,
        doc: '',
      };
      const preisVlueEntity = await nlpEntityService.findOne({
        name: 'intent',
      });
      const preisValue = {
        value: 'preis',
        expressions: [],
        builtin: false,
        entity: preisVlueEntity.id,
      };
      const deValueEntity = await nlpEntityService.findOne({
        name: 'language',
      });
      const deValue = {
        value: 'de',
        expressions: [],
        builtin: false,
        entity: deValueEntity.id,
      };
      const textSample = {
        text: 'Was kostet dieser bmw',
        trained: false,
        type: 'train',
      };

      expect(languageEntityResult).toEqualPayload(languageEntity);
      expect(intentEntityResult).toEqualPayload(intentEntity);
      expect(preisValueResult).toEqualPayload(preisValue);
      expect(deValueResult).toEqualPayload(deValue);
      expect(textSampleResult).toEqualPayload(textSample);
      expect(result).toEqual({ success: true });
    });
  });
});
