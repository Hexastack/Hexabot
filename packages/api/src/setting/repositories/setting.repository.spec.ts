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

import { Setting, SettingCreateDto } from '../dto/setting.dto';
import { SettingOrmEntity } from '../entities/setting.entity';
import { SettingType } from '../types';
import {
  createAttachmentSettingSchema,
  createCheckboxSettingSchema,
  createMultipleAttachmentSettingSchema,
  createMultipleTextSettingSchema,
  createNumberSettingSchema,
  createSecretSettingSchema,
  createSelectSettingSchema,
  createTextSettingSchema,
  createTextareaSettingSchema,
  getSettingConfig,
  getSettingDefault,
} from '../utils/setting-schema-definition.utils';

import { SettingRepository } from './setting.repository';

const toExpectedSetting = (fixture: SettingCreateDto) => ({
  ...fixture,
  value: getSettingDefault(fixture.schema),
  translatable: fixture.translatable ?? false,
});
const buildSchema = (type: SettingType, value: unknown) => {
  switch (type) {
    case SettingType.text:
      return createTextSettingSchema({ defaultValue: value as string });
    case SettingType.textarea:
      return createTextareaSettingSchema({ defaultValue: value as string });
    case SettingType.secret:
      return createSecretSettingSchema({ defaultValue: value as string });
    case SettingType.multiple_text:
      return createMultipleTextSettingSchema({
        defaultValue: value as string[],
      });
    case SettingType.checkbox:
      return createCheckboxSettingSchema({ defaultValue: value as boolean });
    case SettingType.select:
      return createSelectSettingSchema({
        defaultValue: value as string,
        options: ['option'] as const,
      });
    case SettingType.number:
      return createNumberSettingSchema({ defaultValue: value as number });
    case SettingType.attachment:
      return createAttachmentSettingSchema({
        defaultValue: value as string | null,
      });
    case SettingType.multiple_attachment:
      return createMultipleAttachmentSettingSchema({
        defaultValue: value as string[],
      });
  }

  throw new Error(`Unsupported setting type: ${type}`);
};

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
      const expected = settingFixtures
        .filter((fixture) => fixture.group === 'contact')
        .map(toExpectedSetting);

      expect(result).toEqualPayload(expected, [
        'id',
        'createdAt',
        'updatedAt',
        'options',
        'config',
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
      expect(found).toEqualPayload(toExpectedSetting(target), [
        'id',
        'createdAt',
        'updatedAt',
        'options',
        'config',
        'subgroup',
      ]);
    });
  });

  describe('create & update', () => {
    it('persists new settings and updates them', async () => {
      const base = {
        group: `group_${getRandom()}`,
        label: `label_${randomUUID()}`,
        schema: createTextSettingSchema({ defaultValue: 'initial value' }),
        weight: 99,
      };
      const created = await settingRepository.create(base);
      createdIds.push(created.id);

      expect(created).toMatchObject({
        group: base.group,
        label: base.label,
        schema: base.schema,
        value: 'initial value',
        weight: base.weight,
      });
      const persistedAfterCreate = await repository.findOneByOrFail({
        id: created.id,
      });

      expect(persistedAfterCreate.schema).toMatchObject({
        type: 'string',
        default: 'initial value',
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
      const persistedAfterUpdate = await repository.findOneByOrFail({
        id: created.id,
      });

      expect(persistedAfterUpdate.schema).toMatchObject({
        type: 'string',
        default: 'updated value',
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
      schema: buildSchema(type, value),
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
          value: getSettingDefault(payload.schema),
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
        schema: createTextSettingSchema({ defaultValue: 'valid' }),
      };
      const created = await settingRepository.create(base);
      createdIds.push(created.id);

      await expect(
        settingRepository.updateOne(created.id, { value: 123 }),
      ).rejects.toThrow('Setting value must be a string.');
    });
  });

  describe('afterUpdate', () => {
    it('emits hook events with the transformed setting payload', async () => {
      const eventEmitter = settingRepository.getEventEmitter();
      expect(eventEmitter).toBeDefined();

      const emitSpy = jest.spyOn(eventEmitter!, 'emit');
      try {
        const schema = createSelectSettingSchema({
          defaultValue: 'en',
          options: ['en'] as const,
          entity: 'LocaleEntity',
          valueKey: 'code',
          labelKey: 'label',
          enableEntityAddButton: true,
        });
        const databaseEntity = Object.assign(new SettingOrmEntity(), {
          group: 'chatbot_settings',
          label: 'locale',
          schema,
          weight: 10,
          translatable: true,
        });

        expect(databaseEntity.schema).toMatchObject({
          type: 'string',
          default: 'en',
          enum: ['en'],
          'ui:widget': 'AutoCompleteWidget',
          'ui:options': {
            entity: 'LocaleEntity',
            valueKey: 'code',
            labelKey: 'label',
            enableEntityAddButton: true,
          },
        });

        const updateEvent = {
          databaseEntity,
          metadata: repository.metadata,
        } as unknown as UpdateEvent<SettingOrmEntity>;

        await settingRepository.afterUpdate(updateEvent);

        expect(emitSpy).toHaveBeenCalledTimes(1);
        const [eventName, payload] = emitSpy.mock.calls[0];
        expect(eventName).toBe('hook:chatbot_settings:locale');
        expect(payload).toBeInstanceOf(Setting);
        expect(payload).toMatchObject({
          group: 'chatbot_settings',
          label: 'locale',
          schema,
          value: 'en',
          options: ['en'],
          config: getSettingConfig(schema),
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
        schema: createTextSettingSchema({ defaultValue: 'to delete' }),
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
