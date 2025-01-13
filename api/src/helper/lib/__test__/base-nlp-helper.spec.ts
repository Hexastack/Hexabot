/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ObjectId } from 'bson';

import { LoggerService } from '@/logger/logger.service';
import {
  NlpEntity,
  NlpEntityDocument,
  NlpEntityFull,
} from '@/nlp/schemas/nlp-entity.schema';
import { NlpSampleFull } from '@/nlp/schemas/nlp-sample.schema';
import {
  NlpValue,
  NlpValueDocument,
  NlpValueFull,
} from '@/nlp/schemas/nlp-value.schema';
import { SettingService } from '@/setting/services/setting.service';

import { HelperService } from '../../helper.service';
import { HelperName } from '../../types';
import BaseNlpHelper from '../base-nlp-helper';

// Mock services
const mockLoggerService = {
  log: jest.fn(),
  error: jest.fn(),
} as unknown as LoggerService;

const mockSettingService = {
  get: jest.fn(),
} as unknown as SettingService;

const mockHelperService = {
  doSomething: jest.fn(),
} as unknown as HelperService;

// Concrete implementation for testing
class TestNlpHelper extends BaseNlpHelper {
  getPath(): string {
    return __dirname;
  }

  predict(text: string): Promise<any> {
    return Promise.resolve({ text });
  }
}

describe('BaseNlpHelper', () => {
  let helper: TestNlpHelper;

  beforeEach(() => {
    helper = new TestNlpHelper(
      'test-helper' as HelperName,
      mockSettingService,
      mockHelperService,
      mockLoggerService,
    );
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
      const result = await helper.addEntity({} as NlpEntityDocument);
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
      const result = await helper.addValue({} as NlpValueDocument);
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
        { _id: 'entity1', name: 'intent' },
        { _id: 'entity2', name: 'test-entity' },
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

      jest.spyOn(NlpEntity, 'getEntityMap').mockReturnValue({
        entity1: {
          id: new ObjectId().toString(),
          name: 'intent',
          createdAt: new Date(),
          updatedAt: new Date(),
          builtin: false,
          lookups: [],
        },
        entity2: {
          id: new ObjectId().toString(),
          name: 'test-entity',
          createdAt: new Date(),
          updatedAt: new Date(),
          builtin: false,
          lookups: [],
        },
      });
      jest.spyOn(NlpValue, 'getValueMap').mockReturnValue({
        intent1: {
          id: new ObjectId().toString(),
          value: 'test-intent',
          entity: 'entity1', // Add the required entity field
          createdAt: new Date(),
          updatedAt: new Date(),
          builtin: false,
          expressions: [],
          metadata: [],
        },
        value2: {
          id: new ObjectId().toString(),
          value: 'test-value',
          entity: 'entity2', // Add the required entity field
          createdAt: new Date(),
          updatedAt: new Date(),
          builtin: false,
          expressions: [],
          metadata: [],
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
        { _id: 'entity2', name: 'test-entity' },
      ] as unknown as NlpEntityFull[];

      const samples: NlpSampleFull[] = [
        {
          text: 'test-text',
          entities: [{ entity: 'entity2', value: 'value2' }],
          language: { code: 'en' },
        },
      ] as unknown as NlpSampleFull[];

      jest.spyOn(NlpEntity, 'getEntityMap').mockReturnValue({
        entity2: {
          id: new ObjectId().toString(),
          name: 'test-entity',
          createdAt: new Date(),
          updatedAt: new Date(),
          builtin: false,
          lookups: [],
        },
      });

      await expect(helper.format(samples, entities)).rejects.toThrow(
        'Unable to find the `intent` nlp entity.',
      );
    });
  });
});
