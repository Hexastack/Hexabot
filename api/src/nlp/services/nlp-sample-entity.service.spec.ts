/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { Language, LanguageModel } from '@/i18n/schemas/language.schema';
import { nlpSampleFixtures } from '@/utils/test/fixtures/nlpsample';
import {
  installNlpSampleEntityFixtures,
  nlpSampleEntityFixtures,
} from '@/utils/test/fixtures/nlpsampleentity';
import { nlpValueFixtures } from '@/utils/test/fixtures/nlpvalue';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { TFixtures } from '@/utils/test/types';

import { NlpEntityRepository } from '../repositories/nlp-entity.repository';
import { NlpSampleEntityRepository } from '../repositories/nlp-sample-entity.repository';
import { NlpValueRepository } from '../repositories/nlp-value.repository';
import { NlpEntity, NlpEntityModel } from '../schemas/nlp-entity.schema';
import {
  NlpSampleEntity,
  NlpSampleEntityFull,
  NlpSampleEntityModel,
} from '../schemas/nlp-sample-entity.schema';
import { NlpSample, NlpSampleModel } from '../schemas/nlp-sample.schema';
import {
  NlpValue,
  NlpValueModel,
  NlpValueStub,
} from '../schemas/nlp-value.schema';

import { NlpEntityService } from './nlp-entity.service';
import { NlpSampleEntityService } from './nlp-sample-entity.service';
import { NlpValueService } from './nlp-value.service';

describe('NlpSampleEntityService', () => {
  let nlpSampleEntityService: NlpSampleEntityService;
  let nlpSampleEntityRepository: NlpSampleEntityRepository;
  let nlpSampleEntities: NlpSampleEntity[];
  let nlpEntityRepository: NlpEntityRepository;
  let languageRepository: LanguageRepository;
  let nlpEntities: NlpEntity[];
  let languages: Language[];
  let nlpEntityService: NlpEntityService;
  let nlpValueService: NlpValueService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installNlpSampleEntityFixtures),
        MongooseModule.forFeature([
          NlpSampleEntityModel,
          NlpEntityModel,
          NlpSampleModel,
          NlpValueModel,
          LanguageModel,
        ]),
      ],
      providers: [
        NlpSampleEntityRepository,
        NlpEntityRepository,
        NlpValueRepository,
        LanguageRepository,
        NlpSampleEntityService,
        NlpEntityService,
        NlpValueService,
        EventEmitter2,
      ],
    }).compile();
    nlpSampleEntityService = module.get<NlpSampleEntityService>(
      NlpSampleEntityService,
    );
    nlpSampleEntityRepository = module.get<NlpSampleEntityRepository>(
      NlpSampleEntityRepository,
    );
    nlpEntityRepository = module.get<NlpEntityRepository>(NlpEntityRepository);
    languageRepository = module.get<LanguageRepository>(LanguageRepository);
    nlpSampleEntityService = module.get<NlpSampleEntityService>(
      NlpSampleEntityService,
    );
    nlpEntityService = module.get<NlpEntityService>(NlpEntityService);
    nlpValueService = module.get<NlpValueService>(NlpValueService);
    nlpSampleEntities = await nlpSampleEntityRepository.findAll();
    nlpEntities = await nlpEntityRepository.findAll();
    languages = await languageRepository.findAll();
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should return a nlp SampleEntity with populate', async () => {
      const result = await nlpSampleEntityService.findOneAndPopulate(
        nlpSampleEntities[0].id,
      );
      const sampleEntityWithPopulate = {
        ...nlpSampleEntityFixtures[0],
        entity: nlpEntities[0],
        value: { ...nlpValueFixtures[0], entity: nlpEntities[0].id },
        sample: {
          ...nlpSampleFixtures[0],
          language: languages[nlpSampleFixtures[0].language!].id,
        },
      };
      expect(result).toEqualPayload(sampleEntityWithPopulate);
    });
  });

  describe('findPageAndPopulate', () => {
    it('should return all nlp sample entities with populate', async () => {
      const pageQuery = getPageQuery<NlpSampleEntity>({
        sort: ['value', 'asc'],
      });
      const result = await nlpSampleEntityService.findPageAndPopulate(
        {},
        pageQuery,
      );
      const nlpValueFixturesWithEntities = nlpValueFixtures.reduce(
        (acc, curr) => {
          const ValueWithEntities = {
            ...curr,
            entity: nlpEntities[0].id,
          };
          acc.push(ValueWithEntities);
          return acc;
        },
        [] as TFixtures<NlpValueStub>[],
      );
      nlpValueFixturesWithEntities[2] = {
        ...nlpValueFixturesWithEntities[2],
        entity: nlpEntities[1].id,
      };

      const nlpSampleEntityFixturesWithPopulate =
        nlpSampleEntityFixtures.reduce((acc, curr) => {
          const sampleEntityWithPopulate = {
            ...curr,
            entity: nlpEntities[curr.entity],
            value: nlpValueFixturesWithEntities[curr.value],
            sample: {
              ...nlpSampleFixtures[curr.sample],
              language: languages[nlpSampleFixtures[curr.sample].language].id,
            },
          };
          acc.push(sampleEntityWithPopulate);
          return acc;
        }, [] as TFixtures<NlpSampleEntityFull>[]);
      expect(result).toEqualPayload(nlpSampleEntityFixturesWithPopulate);
    });
  });

  describe('storeSampleEntities', () => {
    it('should store sample entities correctly', async () => {
      const sample = { id: '1', text: 'Hello world' } as NlpSample;
      const entities = [
        { entity: 'greeting', value: 'Hello', start: 0, end: 5 },
      ];

      jest
        .spyOn(nlpEntityService, 'storeEntities')
        .mockResolvedValue([{ id: '10', name: 'greeting' } as NlpEntity]);

      jest
        .spyOn(nlpValueService, 'storeValues')
        .mockResolvedValue([{ id: '20', value: 'Hello' } as NlpValue]);

      jest
        .spyOn(nlpSampleEntityService, 'createMany')
        .mockResolvedValue('Expected Result' as any);

      const result = await nlpSampleEntityService.storeSampleEntities(
        sample,
        entities,
      );

      expect(nlpEntityService.storeEntities).toHaveBeenCalledWith(entities);
      expect(nlpValueService.storeValues).toHaveBeenCalledWith(
        sample.text,
        entities,
      );
      expect(nlpSampleEntityService.createMany).toHaveBeenCalledWith([
        { sample: sample.id, entity: '10', value: '20', start: 0, end: 5 },
      ]);
      expect(result).toEqual('Expected Result');
    });

    it('should throw an error if stored entity or value cannot be found', async () => {
      const sample = { id: 1, text: 'Hello world' } as any as NlpSample;
      const entities = [
        { entity: 'greeting', value: 'Hello', start: 0, end: 5 },
      ];

      jest.spyOn(nlpEntityService, 'storeEntities').mockResolvedValue([]);
      jest.spyOn(nlpValueService, 'storeValues').mockResolvedValue([]);

      await expect(
        nlpSampleEntityService.storeSampleEntities(sample, entities),
      ).rejects.toThrow('Unable to find the stored entity or value');
    });
  });
});
