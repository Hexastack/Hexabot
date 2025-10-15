/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { getRepositoryToken } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';

import { TestingModule } from '@nestjs/testing';

import { getRandom } from '@/utils/helpers/safeRandom';
import {
  installSettingFixturesTypeOrm,
  settingFixtures,
} from '@/utils/test/fixtures/setting';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { Setting } from '../entities/setting.entity';
import { SettingType } from '../types';

import { SettingRepository } from './setting.repository';

describe('SettingRepository (TypeORM)', () => {
  let settingRepository: SettingRepository;
  let repository: Repository<Setting>;
  let module: TestingModule;
  const createdIds: string[] = [];

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [SettingRepository],
      typeorm: {
        fixtures: installSettingFixturesTypeOrm,
      },
    });

    module = testing.module;
    settingRepository = module.get(SettingRepository);
    repository = module.get<Repository<Setting>>(
      getRepositoryToken(Setting),
    );
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (createdIds.length > 0) {
      await repository.delete(createdIds);
      createdIds.length = 0;
    }
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('findAll', () => {
    it('returns all settings ordered by weight asc', async () => {
      const result = await settingRepository.findAll(['weight', 'asc']);

      expect(result).toHaveLength(settingFixtures.length);
      const weights = result.map((setting) => setting.weight ?? 0);
      const sortedWeights = [...weights].sort((a, b) => a - b);
      expect(weights).toEqual(sortedWeights);
    });
  });

  describe('find', () => {
    it('filters settings by group', async () => {
      const result = await settingRepository.find({ group: 'contact' });
      const expected = settingFixtures.filter(
        (fixture) => fixture.group === 'contact',
      );

      expect(result).toEqualPayload(expected, [
        'id',
        'createdAt',
        'updatedAt',
        'options',
        'config',
        'translatable',
        'subgroup',
      ]);
    });
  });

  describe('count', () => {
    it('counts settings that match a filter', async () => {
      const total = await settingRepository.count({
        group: 'chatbot_settings',
      });
      const expected = settingFixtures.filter(
        (fixture) => fixture.group === 'chatbot_settings',
      );

      expect(total).toBe(expected.length);
    });
  });

  describe('findOne', () => {
    it('returns the first match for provided criteria', async () => {
      const target = settingFixtures.find(
        (fixture) => fixture.group === 'contact',
      )!;

      const found = await settingRepository.findOne({
        group: target.group,
        label: target.label,
      });

      expect(found).toBeDefined();
      expect(found).toEqualPayload(target, [
        'id',
        'createdAt',
        'updatedAt',
        'options',
        'config',
        'translatable',
        'subgroup',
      ]);
    });
  });

  describe('create & update', () => {
    it('persists new settings and updates them', async () => {
      const base = {
        group: `group_${getRandom()}`,
        label: `label_${randomUUID()}`,
        type: SettingType.text,
        value: 'initial value',
        weight: 99,
      };

      const created = await settingRepository.create(base);
      createdIds.push(created.id);

      expect(created).toMatchObject({
        group: base.group,
        label: base.label,
        type: base.type,
        value: base.value,
        weight: base.weight,
      });

      const updated = await settingRepository.update(created.id, {
        value: 'updated value',
        weight: 100,
      });

      expect(updated).not.toBeNull();
      expect(updated).toMatchObject({
        id: created.id,
        value: 'updated value',
        weight: 100,
      });
    });
  });

  describe('deleteMany', () => {
    it('removes matching settings', async () => {
      const payloads = Array.from({ length: 2 }, () => ({
        group: `cleanup_${getRandom()}`,
        label: `label_${randomUUID()}`,
        type: SettingType.text,
        value: 'to delete',
        weight: 5,
      }));

      const inserted = await settingRepository.createMany(payloads);
      const labels = inserted.map((setting) => setting.label);

      const result = await settingRepository.deleteMany({
        label: { $in: labels },
      });

      expect(result.deletedCount).toBe(payloads.length);
    });
  });

  describe('validateSettingValue', () => {
    it('accepts matching value types', () => {
      expect(() =>
        settingRepository.validateSettingValue(SettingType.text, 'text value'),
      ).not.toThrow();
      expect(() =>
        settingRepository.validateSettingValue(SettingType.multiple_text, [
          'first',
          'second',
        ]),
      ).not.toThrow();
      expect(() =>
        settingRepository.validateSettingValue(SettingType.checkbox, true),
      ).not.toThrow();
      expect(() =>
        settingRepository.validateSettingValue(SettingType.number, 42),
      ).not.toThrow();
      expect(() =>
        settingRepository.validateSettingValue(SettingType.attachment, null),
      ).not.toThrow();
      expect(() =>
        settingRepository.validateSettingValue(SettingType.multiple_attachment, [
          randomUUID(),
        ]),
      ).not.toThrow();
    });

    const failingCases = [
      {
        type: SettingType.text,
        value: 123,
        error: 'Setting value must be a string.',
      },
      {
        type: SettingType.multiple_text,
        value: ['valid', 123],
        error: 'Setting value must be an array of strings.',
      },
      {
        type: SettingType.checkbox,
        value: 'true',
        error: 'Setting value must be a boolean.',
      },
      {
        type: SettingType.number,
        value: '123',
        error: 'Setting value must be a number.',
      },
      {
        type: SettingType.multiple_attachment,
        value: [123],
        error: 'Setting value must be an array of attachment ids.',
      },
      {
        type: SettingType.attachment,
        value: 123,
        error: 'Setting value must be a string or null.',
      },
      {
        type: SettingType.secret,
        value: 123,
        error: 'Setting value must be a string.',
      },
      {
        type: SettingType.select,
        value: 123,
        error: 'Setting value must be a string.',
      },
    ] as const;

    failingCases.forEach(({ type, value, error }) => {
      it(`rejects invalid values for ${type}`, () => {
        expect(() => settingRepository.validateSettingValue(type, value)).toThrow(
          error,
        );
      });
    });
  });
});
