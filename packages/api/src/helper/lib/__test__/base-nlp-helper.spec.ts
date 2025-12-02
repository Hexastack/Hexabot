/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { NlpEntity, NlpEntityFull } from '@/nlp/dto/nlp-entity.dto';
import { NlpSampleFull } from '@/nlp/dto/nlp-sample.dto';
import { NlpValue, NlpValueFull } from '@/nlp/dto/nlp-value.dto';
import { NlpEntityOrmEntity } from '@/nlp/entities/nlp-entity.entity';
import { NlpValueOrmEntity } from '@/nlp/entities/nlp-value.entity';
import { buildTestingMocks } from '@/utils/test/utils';

import { BaseNlpHelper } from '../base-nlp-helper';

// Concrete implementation for testing
@Injectable()
class TestNlpHelper extends BaseNlpHelper<'test-helper'> {
  getPath(): string {
    return __dirname;
  }

  predict(text: string): Promise<any> {
    return Promise.resolve({ text });
  }
}

describe('BaseNlpHelper', () => {
  let helper: TestNlpHelper;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      providers: [TestNlpHelper],
    });
    [helper] = await getMocks([TestNlpHelper]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateEntity', () => {
    it('should return the updated entity', async () => {
      const entity: NlpEntity = { name: 'test-entity' } as NlpEntity;
      const result = await helper.updateEntity(entity);
      expect(result).toBe(entity);
    });
  });

  describe('addEntity', () => {
    it('should return a new UUID', async () => {
      const result = await helper.addEntity({} as NlpEntity);
      expect(result).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    });
  });

  describe('deleteEntity', () => {
    it('should return the deleted entity ID', async () => {
      const entityId = 'entity-id';
      const result = await helper.deleteEntity(entityId);
      expect(result).toBe(entityId);
    });
  });

  describe('updateValue', () => {
    it('should return the updated value', async () => {
      const value: NlpValue = { value: 'test-value' } as NlpValue;
      const result = await helper.updateValue(value);
      expect(result).toBe(value);
    });
  });

  describe('addValue', () => {
    it('should return a new UUID', async () => {
      const result = await helper.addValue({} as NlpValue);
      expect(result).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    });
  });

  describe('deleteValue', () => {
    it('should return the deleted value', async () => {
      const value: NlpValueFull = { value: 'test-value' } as NlpValueFull;
      const result = await helper.deleteValue(value);
      expect(result).toBe(value);
    });
  });

  describe('format', () => {
    it('should format the samples and entities into NLP training data', async () => {
      const entities: NlpEntityFull[] = [
        { id: 'entity1-id', name: 'intent' },
        { id: 'entity2-id', name: 'test-entity' },
      ] as unknown as NlpEntityFull[];
      const samples: NlpSampleFull[] = [
        {
          text: 'test-text',
          entities: [
            { entity: 'entity1', value: 'intent1' },
            { entity: 'entity2', value: 'value2', start: 0, end: 4 },
          ],
          language: { code: 'en' },
        },
      ] as unknown as NlpSampleFull[];

      jest.spyOn(NlpEntityOrmEntity, 'getEntityMap').mockReturnValue({
        entity1: {
          id: 'entity1-id',
          name: 'intent',
          createdAt: new Date(),
          updatedAt: new Date(),
          builtin: false,
          lookups: [],
          weight: 1,
          foreignId: null,
        },
        entity2: {
          id: 'entity2-id',
          name: 'test-entity',
          createdAt: new Date(),
          updatedAt: new Date(),
          builtin: false,
          lookups: [],
          weight: 1,
          foreignId: null,
        },
      });
      jest.spyOn(NlpValueOrmEntity, 'getValueMap').mockReturnValue({
        intent1: {
          id: 'value1-id',
          value: 'test-intent',
          entity: 'entity1-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          builtin: false,
          expressions: [],
          metadata: {},
          foreignId: null,
        },
        value2: {
          id: 'value2-id',
          value: 'test-value',
          entity: 'entity2-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          builtin: false,
          expressions: [],
          metadata: {},
          foreignId: null,
        },
      });

      const result = await helper.format(samples, entities);

      expect(result).toEqual([
        {
          text: 'test-text',
          intent: 'test-intent',
          entities: [
            { entity: 'test-entity', value: 'test-value', start: 0, end: 4 },
            { entity: 'language', value: 'en' },
          ],
        },
      ]);
    });

    it('should throw an error if intent entity is missing', async () => {
      const entities: NlpEntityFull[] = [
        { id: 'entity2-id', name: 'test-entity' },
      ] as unknown as NlpEntityFull[];
      const samples: NlpSampleFull[] = [
        {
          text: 'test-text',
          entities: [{ entity: 'entity2', value: 'value2' }],
          language: { code: 'en' },
        },
      ] as unknown as NlpSampleFull[];

      jest.spyOn(NlpEntityOrmEntity, 'getEntityMap').mockReturnValue({
        entity2: {
          id: 'entity2-id',
          name: 'test-entity',
          createdAt: new Date(),
          updatedAt: new Date(),
          builtin: false,
          lookups: [],
          weight: 1,
          foreignId: null,
        },
      });

      await expect(helper.format(samples, entities)).rejects.toThrow(
        'Unable to find the `intent` nlp entity.',
      );
    });
  });

  describe('extractKeywordBasedSlots', () => {
    it('should return matches for keywords and synonyms in English using Latin script', () => {
      const entity: NlpEntityFull = {
        name: 'color',
        values: [
          { value: 'blue', expressions: ['azure', 'navy'] },
          { value: 'green', expressions: ['emerald', 'lime'] },
        ],
      } as any;
      const result = helper.extractKeywordBasedSlots(
        'The sky is azure and emerald',
        entity,
      );
      expect(result).toEqual([
        {
          entity: 'color',
          value: 'blue',
          start: 11,
          end: 16,
          confidence: 1,
        },
        {
          entity: 'color',
          value: 'green',
          start: 21,
          end: 28,
          confidence: 1,
        },
      ]);
    });

    it('should return matches for keywords in Arabic using non-Latin Unicode script', () => {
      const entity: NlpEntityFull = {
        name: 'color',
        values: [{ value: 'blue', expressions: ['أزرق', 'ازرق', 'زرقاء'] }],
      } as any;
      const result = helper.extractKeywordBasedSlots('السماء زرقاء', entity);
      expect(result).toEqual([
        {
          entity: 'color',
          value: 'blue',
          start: 7,
          end: 12,
          confidence: 1,
        },
      ]);
    });

    it('should correctly match keywords with French accents (Unicode characters) and return accurate start and end indices', () => {
      const entity: NlpEntityFull = {
        name: 'items',
        values: [{ value: 'key', expressions: ['clé', 'porte-clés'] }],
      } as any;
      const result = helper.extractKeywordBasedSlots(
        'il a perdu son porte-clés',
        entity,
      );
      expect(result).toEqual([
        {
          entity: 'items',
          value: 'key',
          start: 15,
          end: 25,
          confidence: 1,
        },
      ]);
    });

    it('should return matches when expressions are not bounded by whitespace (e.g., surrounded by quotes)', () => {
      const entity: NlpEntityFull = {
        name: 'color',
        values: [
          { value: 'blue', expressions: ['azure', 'navy'] },
          { value: 'green', expressions: ['emerald', 'lime'] },
        ],
      } as any;
      const result = helper.extractKeywordBasedSlots(
        `The sky is "azure" and "emerald"`,
        entity,
      );
      expect(result).toEqual([
        {
          entity: 'color',
          value: 'blue',
          start: 12,
          end: 17,
          confidence: 1,
        },
        {
          entity: 'color',
          value: 'green',
          start: 24,
          end: 31,
          confidence: 1,
        },
      ]);
    });

    it('should not match partial keywords and return an empty result', () => {
      const entity: NlpEntityFull = {
        name: 'items',
        values: [{ value: 'key', expressions: ['clé', 'porte-clés'] }],
      } as any;
      const result = helper.extractKeywordBasedSlots(
        'Dieu est clément',
        entity,
      );
      expect(result).toEqual([]);
    });

    it('should return empty array if no values present', () => {
      const result = helper.extractKeywordBasedSlots('anything', {
        name: 'empty',
        values: [],
      } as any);

      expect(result).toEqual([]);
    });
  });

  describe('extractPatternBasedSlots', () => {
    it('should match using a valid regex pattern', () => {
      const entity: NlpEntityFull = {
        name: 'infos',
        values: [
          {
            value: 'number',
            metadata: { pattern: '\\d+', wordBoundary: true },
          },
        ],
      } as NlpEntityFull;
      const result = helper.extractPatternBasedSlots(
        'Order 123 and 456 now!',
        entity,
      );
      expect(result).toEqual([
        {
          entity: 'infos',
          canonicalValue: 'number',
          value: '123',
          start: 6,
          end: 9,
          confidence: 1,
        },
        {
          entity: 'infos',
          canonicalValue: 'number',
          value: '456',
          start: 14,
          end: 17,
          confidence: 1,
        },
      ]);
    });

    it('should respect metadata like toLowerCase and removeSpaces', () => {
      const entity: NlpEntityFull = {
        name: 'name',
        values: [
          {
            value: 'brand',
            metadata: {
              pattern: 'HEX BOT',
              toLowerCase: true,
              removeSpaces: true,
            },
          },
        ],
      } as NlpEntityFull;
      const result = helper.extractPatternBasedSlots(
        'My CODE is HEX BOT!',
        entity,
      );
      expect(result).toEqual([
        {
          entity: 'name',
          canonicalValue: 'brand',
          value: 'hexbot',
          start: 11,
          end: 18,
          confidence: 1,
        },
      ]);
    });

    it('should match varied forms using a regex pattern with Unicode characters', () => {
      const entity: NlpEntityFull = {
        name: 'state',
        values: [
          {
            value: 'damage',
            metadata: {
              pattern: 'endommag[ée](e|é|s|es)?',
              wordBoundary: true,
            },
          },
        ],
      } as NlpEntityFull;
      const result = helper.extractPatternBasedSlots(
        'clé USB est endommagée',
        entity,
      );
      expect(result).toEqual([
        {
          entity: 'state',
          canonicalValue: 'damage',
          value: 'endommagée',
          start: 12,
          end: 22,
          confidence: 1,
        },
      ]);
    });

    it('should match words followed by special characters using a Unicode-aware regex pattern', () => {
      const entity: NlpEntityFull = {
        name: 'state',
        values: [
          {
            value: 'damage',
            metadata: {
              pattern: 'endommag[ée](e|é|s|es)?',
              wordBoundary: true,
            },
          },
        ],
      } as NlpEntityFull;
      const result = helper.extractPatternBasedSlots(
        'comment réparer un clé USB endommagée?',
        entity,
      );
      expect(result).toEqual([
        {
          entity: 'state',
          canonicalValue: 'damage',
          value: 'endommagée',
          start: 27,
          end: 37,
          confidence: 1,
        },
      ]);
    });

    it('should match Arabic word using a regex pattern with Unicode characters', () => {
      const entity: NlpEntityFull = {
        name: 'state',
        values: [
          {
            value: 'damage',
            metadata: { pattern: 'معطب', wordBoundary: true },
          },
        ],
      } as NlpEntityFull;
      const result = helper.extractPatternBasedSlots(
        'هذا الحاسوب معطب',
        entity,
      );
      expect(result).toEqual([
        {
          entity: 'state',
          canonicalValue: 'damage',
          value: 'معطب',
          start: 12,
          end: 16,
          confidence: 1,
        },
      ]);
    });

    it('should match Arabic word with optional definite article followed by special characters using a Unicode-aware regex pattern', () => {
      const entity: NlpEntityFull = {
        name: 'state',
        values: [
          {
            value: 'damage',
            metadata: { pattern: '(ال)?عطب', wordBoundary: true },
          },
        ],
      } as NlpEntityFull;
      const result = helper.extractPatternBasedSlots(
        'كيف يمكن إصلاح هذا العطب؟',
        entity,
      );
      expect(result).toEqual([
        {
          entity: 'state',
          canonicalValue: 'damage',
          value: 'العطب',
          start: 19,
          end: 24,
          confidence: 1,
        },
      ]);
    });

    it('should respect metadata stripDiacritics', () => {
      const entity: NlpEntityFull = {
        name: 'keyword',
        values: [
          {
            value: 'word',
            metadata: {
              pattern: '".+"',
              toLowerCase: true,
              removeSpaces: true,
              stripDiacritics: true,
            },
          },
        ],
      } as NlpEntityFull;
      const result = helper.extractPatternBasedSlots(
        'The word "où" (where)',
        entity,
      );
      expect(result).toEqual([
        {
          entity: 'keyword',
          canonicalValue: 'word',
          value: '"ou"',
          start: 9,
          end: 13,
          confidence: 1,
        },
      ]);
    });

    it('should return empty array if no values', () => {
      const result = helper.extractPatternBasedSlots('test', {
        name: 'noop',
        values: [],
      } as any);

      expect(result).toEqual([]);
    });

    it('should handle invalid regex pattern gracefully', () => {
      const entity: NlpEntityFull = {
        name: 'fail',
        values: [
          {
            value: 'Invalid',
            metadata: { pattern: '[a-', wordBoundary: true },
          },
        ],
      } as any;
      const result = helper.extractPatternBasedSlots('test', entity);
      expect(result).toEqual([]);
    });
  });

  describe('runDeterministicSlotFilling', () => {
    it('should call keyword-based extractor for keyword lookup strategy', () => {
      const mockEntities: NlpEntityFull[] = [
        {
          name: 'product',
          lookups: ['keywords'],
          values: [
            {
              value: 'tshirt',
              expressions: [],
            },
            {
              value: 'pizza',
              expressions: [],
            },
          ],
        } as unknown as NlpEntityFull,
      ];
      jest.spyOn(helper, 'extractKeywordBasedSlots');
      jest.spyOn(helper, 'extractPatternBasedSlots');

      const result = helper.runDeterministicSlotFilling(
        'order pizza',
        mockEntities,
      );

      expect(helper.extractKeywordBasedSlots).toHaveBeenCalledTimes(1);
      expect(helper.extractPatternBasedSlots).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].entity).toBe('product');
    });

    it('should call pattern-based extractor for pattern lookup strategy', () => {
      const mockEntities: NlpEntityFull[] = [
        {
          name: 'number',
          lookups: ['pattern'],
          values: [
            {
              value: 'phone',
              metadata: { pattern: '\\d+' },
              expressions: [],
            },
          ],
        } as unknown as NlpEntityFull,
      ];

      jest.spyOn(helper, 'extractKeywordBasedSlots');
      jest.spyOn(helper, 'extractPatternBasedSlots');

      const result = helper.runDeterministicSlotFilling(
        'call me at 1234567890',
        mockEntities,
      );

      expect(helper.extractPatternBasedSlots).toHaveBeenCalledTimes(1);
      expect(helper.extractKeywordBasedSlots).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].entity).toBe('number');
    });

    it('should skip entities that do not support the selected lookup strategy', () => {
      const mockEntities: NlpEntityFull[] = [
        {
          name: 'irrelevant',
          lookups: ['trait'],
          values: [],
        } as unknown as NlpEntityFull,
      ];
      jest.spyOn(helper, 'extractKeywordBasedSlots');
      jest.spyOn(helper, 'extractPatternBasedSlots');

      const result = helper.runDeterministicSlotFilling(
        'any text',
        mockEntities,
      );

      expect(helper.extractKeywordBasedSlots).not.toHaveBeenCalled();
      expect(helper.extractPatternBasedSlots).not.toHaveBeenCalled();
      expect(result).toHaveLength(0);
    });
  });
});
