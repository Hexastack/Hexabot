/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { Language } from '@/i18n/schemas/language.schema';
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
import { buildTestingMocks } from '@/utils/test/utils';

import { NlpSampleEntityCreateDto } from '../dto/nlp-sample-entity.dto';
import { NlpEntityRepository } from '../repositories/nlp-entity.repository';
import { NlpSampleEntityRepository } from '../repositories/nlp-sample-entity.repository';
import { NlpEntity } from '../schemas/nlp-entity.schema';
import {
  NlpSampleEntity,
  NlpSampleEntityFull,
} from '../schemas/nlp-sample-entity.schema';
import { NlpSample } from '../schemas/nlp-sample.schema';
import { NlpValue, NlpValueStub } from '../schemas/nlp-value.schema';

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
    const { getMocks } = await buildTestingMocks({
      models: ['NlpSampleModel'],
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installNlpSampleEntityFixtures)],
      providers: [NlpSampleEntityService, LanguageRepository],
    });
    [
      nlpSampleEntityService,
      nlpSampleEntityRepository,
      nlpEntityRepository,
      languageRepository,
      nlpEntityService,
      nlpValueService,
    ] = await getMocks([
      NlpSampleEntityService,
      NlpSampleEntityRepository,
      NlpEntityRepository,
      LanguageRepository,
      NlpEntityService,
      NlpValueService,
    ]);
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

  describe('findAndPopulate', () => {
    it('should return all nlp sample entities with populate', async () => {
      const pageQuery = getPageQuery<NlpSampleEntity>({
        sort: ['value', 'asc'],
      });
      const result = await nlpSampleEntityService.findAndPopulate(
        {},
        pageQuery,
      );
      const nlpValueFixturesWithEntities = nlpValueFixtures.reduce(
        (acc, curr) => {
          const ValueWithEntities = {
            ...curr,
            entity: nlpEntities[0].id,
            expressions: curr.expressions!,
            builtin: curr.builtin!,
            metadata: curr.metadata!,
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
      const sample: NlpSample = {
        id: 's1',
        text: 'Hello world',
        language: null,
        trained: false,
        type: 'train',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
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

  describe('extractKeywordEntities', () => {
    it('should extract entities when keywords are found', () => {
      const sample = {
        id: 's1',
        text: 'Hello world, AI is amazing!',
      } as NlpSample;
      const value = {
        id: 'v1',
        entity: 'e1',
        value: 'AI',
        expressions: ['amazing'],
      } as NlpValue;

      const expected: NlpSampleEntityCreateDto[] = [
        {
          sample: 's1',
          entity: 'e1',
          value: 'v1',
          start: 13,
          end: 15,
        },
        {
          sample: 's1',
          entity: 'e1',
          value: 'v1',
          start: 19,
          end: 26,
        },
      ];

      expect(
        nlpSampleEntityService.extractKeywordEntities(sample, value),
      ).toEqual(expected);
    });

    it('should be case-insensitive', () => {
      const sample = {
        id: 's2',
        text: 'I love ai and artificial intelligence.',
      } as NlpSample;
      const value = {
        id: 'v2',
        entity: 'e2',
        value: 'AI',
        expressions: [],
      } as unknown as NlpValue;

      const expected: NlpSampleEntityCreateDto[] = [
        {
          sample: 's2',
          entity: 'e2',
          value: 'v2',
          start: 7,
          end: 9,
        },
      ];

      expect(
        nlpSampleEntityService.extractKeywordEntities(sample, value),
      ).toEqual(expected);
    });

    it('should extract multiple occurrences of the same keyword', () => {
      const sample = {
        id: 's3',
        text: 'AI AI AI is everywhere.',
      } as NlpSample;
      const value = {
        id: 'v3',
        entity: 'e3',
        value: 'AI',
        expressions: [],
      } as unknown as NlpValue;

      const expected: NlpSampleEntityCreateDto[] = [
        {
          sample: 's3',
          entity: 'e3',
          value: 'v3',
          start: 0,
          end: 2,
        },
        {
          sample: 's3',
          entity: 'e3',
          value: 'v3',
          start: 3,
          end: 5,
        },
        {
          sample: 's3',
          entity: 'e3',
          value: 'v3',
          start: 6,
          end: 8,
        },
      ];

      expect(
        nlpSampleEntityService.extractKeywordEntities(sample, value),
      ).toEqual(expected);
    });

    it('should handle empty expressions array correctly', () => {
      const sample = {
        id: 's4',
        text: 'Data science is great.',
      } as NlpSample;
      const value = {
        id: 'v4',
        entity: 'e4',
        value: 'science',
        expressions: [],
      } as unknown as NlpValue;

      const expected: NlpSampleEntityCreateDto[] = [
        {
          sample: 's4',
          entity: 'e4',
          value: 'v4',
          start: 5,
          end: 12,
        },
      ];

      expect(
        nlpSampleEntityService.extractKeywordEntities(sample, value),
      ).toEqual(expected);
    });

    it('should return an empty array if no matches are found', () => {
      const sample = { id: 'sample5', text: 'Hello world!' } as NlpSample;
      const value = {
        id: 'v5',
        entity: 'e5',
        value: 'Python',
        expressions: [],
      } as unknown as NlpValue;

      expect(
        nlpSampleEntityService.extractKeywordEntities(sample, value),
      ).toEqual([]);
    });

    it('should match keywords as whole words only', () => {
      const sample = {
        id: 'sample6',
        text: 'Technical claim.',
      } as NlpSample;
      const value = {
        id: 'v6',
        entity: 'e6',
        value: 'AI',
        expressions: [],
      } as unknown as NlpValue;

      // Should not match "AI-powered" since it's not a standalone word
      const expected: NlpSampleEntityCreateDto[] = [];

      expect(
        nlpSampleEntityService.extractKeywordEntities(sample, value),
      ).toEqual(expected);
    });

    it('should handle special characters in the text correctly', () => {
      const sample = { id: 's7', text: 'Hello, AI. AI? AI!' } as NlpSample;
      const value = {
        id: 'v7',
        entity: 'e7',
        value: 'AI',
        expressions: [],
      } as unknown as NlpValue;

      const expected: NlpSampleEntityCreateDto[] = [
        {
          sample: 's7',
          entity: 'e7',
          value: 'v7',
          start: 7,
          end: 9,
        },
        {
          sample: 's7',
          entity: 'e7',
          value: 'v7',
          start: 11,
          end: 13,
        },
        {
          sample: 's7',
          entity: 'e7',
          value: 'v7',
          start: 15,
          end: 17,
        },
      ];

      expect(
        nlpSampleEntityService.extractKeywordEntities(sample, value),
      ).toEqual(expected);
    });

    it('should handle regex special characters in keyword values correctly', () => {
      const sample = {
        id: 's10',
        text: 'Find the,AI, in this text.',
      } as NlpSample;

      const value = {
        id: 'v10',
        entity: 'e10',
        value: 'AI',
        expressions: [],
      } as unknown as NlpValue;

      const expected: NlpSampleEntityCreateDto[] = [
        {
          sample: 's10',
          entity: 'e10',
          value: 'v10',
          start: 9,
          end: 11,
        },
      ];

      expect(
        nlpSampleEntityService.extractKeywordEntities(sample, value),
      ).toEqual(expected);
    });
  });
});
