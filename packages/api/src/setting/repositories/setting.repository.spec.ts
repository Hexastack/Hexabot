/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, Repository, UpdateEvent } from 'typeorm';

import { getRandom } from '@/utils/helpers/safeRandom';
import {
  installSettingFixturesTypeOrm,
  settingFixtures,
} from '@/utils/test/fixtures/setting';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { Setting } from '../dto/setting.dto';
import { SettingOrmEntity } from '../entities/setting.entity';
import { SettingType } from '../types';

import { SettingRepository } from './setting.repository';

describe('SettingRepository (TypeORM)', () => {
  let settingRepository: SettingRepository;
  let repository: Repository<SettingOrmEntity>;
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
    repository = module.get<Repository<SettingOrmEntity>>(
      getRepositoryToken(SettingOrmEntity),
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
      const result = await settingRepository.findAll({
        order: { weight: 'asc' },
      });

      expect(result).toHaveLength(settingFixtures.length);
      const weights = result.map((setting) => setting.weight ?? 0);
      const sortedWeights = [...weights].sort((a, b) => a - b);
      expect(weights).toEqual(sortedWeights);
    });
  });

  describe('find', () => {
    it('filters settings by group', async () => {
      const result = await settingRepository.find({
        where: { group: 'contact' },
        order: { weight: 'asc' },
      });
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
        where: { group: 'chatbot_settings' },
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
        where: {
          group: target.group,
          label: target.label,
        },
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

      const updated = await settingRepository.updateOne(created.id, {
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

  describe('value validation', () => {
    const buildPayload = (
      type: SettingType,
      value: any,
    ): Parameters<typeof settingRepository.create>[0] => ({
      group: `group_${getRandom()}`,
      label: `label_${randomUUID()}`,
      type,
      value,
      ...(type === SettingType.select ? { options: ['option'] } : {}),
    });

    const passingCases: ReadonlyArray<
      [SettingType, () => Parameters<typeof buildPayload>[1]]
    > = [
      [SettingType.text, () => 'text value'],
      [SettingType.textarea, () => 'textarea value'],
      [SettingType.secret, () => 'secret value'],
      [SettingType.multiple_text, () => ['first', 'second']],
      [SettingType.checkbox, () => true],
      [SettingType.select, () => 'option'],
      [SettingType.number, () => 42],
      [SettingType.attachment, () => null],
      [SettingType.multiple_attachment, () => [randomUUID()]],
    ];

    it.each(passingCases)(
      'accepts valid values for %s',
      async (type, valueFactory) => {
        const payload = buildPayload(type, valueFactory());
        const created = await settingRepository.create(payload);
        createdIds.push(created.id);

        expect(created).toMatchObject({
          type,
          value: payload.value,
        });
      },
    );

    const failingCases: ReadonlyArray<
      [SettingType, () => Parameters<typeof buildPayload>[1], string]
    > = [
      [SettingType.text, () => 123, 'Setting value must be a string.'],
      [
        SettingType.multiple_text,
        () => ['valid', 123],
        'Setting value must be an array of strings.',
      ],
      [SettingType.checkbox, () => 'true', 'Setting value must be a boolean.'],
      [SettingType.number, () => '123', 'Setting value must be a number.'],
      [
        SettingType.multiple_attachment,
        () => [123],
        'Setting value must be an array of attachment ids.',
      ],
      [
        SettingType.attachment,
        () => 123,
        'Setting value must be a string or null.',
      ],
      [SettingType.secret, () => 123, 'Setting value must be a string.'],
      [SettingType.select, () => 123, 'Setting value must be a string.'],
    ];

    it.each(failingCases)(
      'rejects invalid values for %s',
      async (type, valueFactory, error) => {
        await expect(
          settingRepository.create(buildPayload(type, valueFactory())),
        ).rejects.toThrow(error);
      },
    );

    it('rejects invalid values on update', async () => {
      const base = {
        group: `group_${getRandom()}`,
        label: `label_${randomUUID()}`,
        type: SettingType.text,
        value: 'valid',
      };

      const created = await settingRepository.create(base);
      createdIds.push(created.id);

      await expect(
        settingRepository.updateOne(created.id, { value: 123 }),
      ).rejects.toThrow('Setting value must be a string.');
    });
  });

  describe('afterUpdate', () => {
    it('emits hook events with the transformed setting payload', () => {
      const eventEmitter = settingRepository.getEventEmitter();
      expect(eventEmitter).toBeDefined();

      const emitSpy = jest.spyOn(eventEmitter!, 'emit');
      try {
        const databaseEntity = Object.assign(new SettingOrmEntity(), {
          group: 'chatbot_settings',
          label: 'locale',
          type: SettingType.text,
          value: 'en',
          options: ['en'],
          config: { featureFlag: true },
          weight: 10,
          translatable: true,
        });

        const updateEvent = {
          databaseEntity,
        } as unknown as UpdateEvent<SettingOrmEntity>;

        settingRepository.afterUpdate(updateEvent);

        expect(emitSpy).toHaveBeenCalledTimes(1);
        const [eventName, payload] = emitSpy.mock.calls[0];
        expect(eventName).toBe('hook:chatbot_settings:locale');
        expect(payload).toBeInstanceOf(Setting);
        expect(payload).toMatchObject({
          group: 'chatbot_settings',
          label: 'locale',
          type: SettingType.text,
          value: 'en',
          options: ['en'],
          config: { featureFlag: true },
          weight: 10,
          translatable: true,
        });
      } finally {
        emitSpy.mockRestore();
      }
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
        where: {
          label: In(labels),
        },
      });

      expect(result.deletedCount).toBe(payloads.length);
    });
  });
});
