/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { nlpSampleFixtures } from '@/utils/test/fixtures/nlpsample';
import { installNlpSampleEntityFixtures } from '@/utils/test/fixtures/nlpsampleentity';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { NlpEntityService } from './nlp-entity.service';
import { NlpSampleEntityService } from './nlp-sample-entity.service';
import { NlpSampleService } from './nlp-sample.service';
import { NlpValueService } from './nlp-value.service';
import { NlpEntityRepository } from '../repositories/nlp-entity.repository';
import { NlpSampleEntityRepository } from '../repositories/nlp-sample-entity.repository';
import { NlpSampleRepository } from '../repositories/nlp-sample.repository';
import { NlpValueRepository } from '../repositories/nlp-value.repository';
import { NlpEntityModel } from '../schemas/nlp-entity.schema';
import {
  NlpSampleEntityModel,
  NlpSampleEntity,
} from '../schemas/nlp-sample-entity.schema';
import { NlpSampleModel, NlpSample } from '../schemas/nlp-sample.schema';
import { NlpValueModel } from '../schemas/nlp-value.schema';

describe('NlpSampleService', () => {
  let nlpSampleService: NlpSampleService;
  let nlpSampleEntityRepository: NlpSampleEntityRepository;
  let nlpSampleRepository: NlpSampleRepository;
  let noNlpSample: NlpSample;
  let nlpSampleEntity: NlpSampleEntity;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installNlpSampleEntityFixtures),
        MongooseModule.forFeature([
          NlpSampleModel,
          NlpSampleEntityModel,
          NlpValueModel,
          NlpEntityModel,
        ]),
      ],
      providers: [
        NlpSampleRepository,
        NlpSampleEntityRepository,
        NlpEntityRepository,
        NlpValueRepository,
        NlpSampleService,
        NlpSampleEntityService,
        NlpEntityService,
        NlpValueService,
        EventEmitter2,
      ],
    }).compile();
    nlpSampleService = module.get<NlpSampleService>(NlpSampleService);
    nlpSampleRepository = module.get<NlpSampleRepository>(NlpSampleRepository);
    nlpSampleEntityRepository = module.get<NlpSampleEntityRepository>(
      NlpSampleEntityRepository,
    );
    nlpSampleEntityRepository = module.get<NlpSampleEntityRepository>(
      NlpSampleEntityRepository,
    );
    noNlpSample = await nlpSampleService.findOne({ text: 'No' });
    nlpSampleEntity = await nlpSampleEntityRepository.findOne({
      sample: noNlpSample.id,
    });
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should return a nlp Sample with populate', async () => {
      const result = await nlpSampleService.findOneAndPopulate(noNlpSample.id);
      const sampleWithEntities = {
        ...nlpSampleFixtures[1],
        entities: [nlpSampleEntity],
      };
      expect(result).toEqualPayload(sampleWithEntities);
    });
  });

  describe('findPageAndPopulate', () => {
    it('should return all nlp samples with populate', async () => {
      const pageQuery = getPageQuery<NlpSample>({ sort: ['text', 'desc'] });
      const result = await nlpSampleService.findPageAndPopulate({}, pageQuery);
      const nlpSamples = await nlpSampleRepository.findAll();
      const nlpSampleEntities = await nlpSampleEntityRepository.findAll();

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
  });

  describe('updateMany', () => {
    it('should update many nlp samples', async () => {
      const result = await nlpSampleService.updateMany(
        {},
        {
          trained: false,
        },
      );

      expect(result.modifiedCount).toEqual(nlpSampleFixtures.length);
    });
  });

  describe('The deleteCascadeOne function', () => {
    it('should delete a nlp Sample', async () => {
      const result = await nlpSampleService.deleteOne(noNlpSample.id);
      expect(result.deletedCount).toEqual(1);
    });
  });
});
