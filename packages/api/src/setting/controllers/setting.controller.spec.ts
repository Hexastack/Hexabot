/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';

import {
  installSettingFixturesTypeOrm,
  settingFixtures,
} from '@/utils/test/fixtures/setting';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { Setting } from '../dto/setting.dto';
import { SettingOrmEntity } from '../entities/setting.entity';
import { SettingService } from '../services/setting.service';
import {
  getSettingConfig,
  getSettingDefault,
  getSettingOptions,
  withSettingDefault,
} from '../utils/setting-schema-definition.utils';

import { SettingController } from './setting.controller';

const expectedSettings = settingFixtures.map((setting) => ({
  ...setting,
  value: getSettingDefault(setting.schema),
  ...(getSettingOptions(setting.schema)
    ? { options: getSettingOptions(setting.schema) }
    : {}),
  ...(getSettingConfig(setting.schema)
    ? { config: getSettingConfig(setting.schema) }
    : {}),
  translatable: setting.translatable ?? false,
}));

describe('SettingController', () => {
  let settingController: SettingController;
  let settingService: SettingService;
  let module: TestingModule;

  beforeAll(async () => {
    const { module: testingModule, getMocks } = await buildTestingMocks({
      autoInjectFrom: ['controllers'],
      controllers: [SettingController],
      typeorm: {
        fixtures: installSettingFixturesTypeOrm,
      },
    });
    module = testingModule;
    [settingController, settingService] = await getMocks([
      SettingController,
      SettingService,
    ]);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  afterEach(jest.clearAllMocks);

  describe('find', () => {
    it('Should return an array of ordered Settings by group ', async () => {
      jest.spyOn(settingService, 'find');
      const options = {
        where: {},
        order: { weight: 'ASC' as any },
      };
      const result = await settingController.find(options);

      expect(settingService.find).toHaveBeenCalledWith(options);
      expect(result).toEqualPayload(expectedSettings, [
        'id',
        'createdAt',
        'updatedAt',
      ]);
    });
  });

  describe('updateOne', () => {
    it('Should update and return a specific Setting', async () => {
      jest.spyOn(settingService, 'updateOne');
      const payload = {
        value: 'updated setting value',
      };
      const { id } = (await settingService.findOne({
        where: { label: 'contact_email_recipient' },
      })) as Setting;
      const result = await settingController.updateOne(id, payload);
      const target = expectedSettings.find(
        (settingFixture) => settingFixture.label === 'contact_email_recipient',
      )!;

      expect(settingService.updateOne).toHaveBeenCalledWith(id, payload);
      expect(result).toEqualPayload(
        {
          ...target,
          schema: withSettingDefault(target.schema, payload.value),
          value: payload.value,
        },
        ['id', 'createdAt', 'updatedAt'],
      );
    });

    it('Should validate value type before update', async () => {
      const setting = (await settingService.findOne({
        where: { label: 'contact_email_recipient' },
      })) as Setting;
      const assertValidValueSpy = jest.spyOn(
        SettingOrmEntity.prototype as any,
        'assertValidValue',
      );

      try {
        await expect(
          settingController.updateOne(setting.id, { value: 123 as any }),
        ).rejects.toThrow('Setting value must be a string.');

        expect(assertValidValueSpy).toHaveBeenCalled();
      } finally {
        assertValidValueSpy.mockRestore();
      }
    });
  });

  describe('updateGroup', () => {
    it('updates a schema-driven group payload', async () => {
      jest.spyOn(settingService, 'updateGroup');
      const result = await settingController.updateGroup('contact', {
        values: {
          company_name: 'Acme',
        },
      });

      expect(settingService.updateGroup).toHaveBeenCalledWith('contact', {
        company_name: 'Acme',
      });
      expect(
        result.find((setting) => setting.label === 'company_name')?.value,
      ).toBe('Acme');
      expect(
        result.find((setting) => setting.label === 'company_country')?.value,
      ).toBe('US');
    });
  });
});
