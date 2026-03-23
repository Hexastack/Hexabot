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

import {
  CONTACT_SETTINGS_GROUP,
  contactSettingsSchema,
} from '../default.settings';
import { Setting } from '../dto/setting.dto';
import { RuntimeSettingsService } from '../runtime-settings.service';
import { SettingService } from '../services/setting.service';

import { SettingController } from './setting.controller';

const expectedSettings = settingFixtures.map((setting) => ({
  ...setting,
  subgroup: null,
}));

describe('SettingController', () => {
  let settingController: SettingController;
  let settingService: SettingService;
  let runtimeSettingsService: RuntimeSettingsService;
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
    [settingController, settingService, runtimeSettingsService] =
      await getMocks([
        SettingController,
        SettingService,
        RuntimeSettingsService,
      ]);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  beforeEach(() => {
    runtimeSettingsService.reset();
    runtimeSettingsService.register({
      group: CONTACT_SETTINGS_GROUP,
      schema: contactSettingsSchema,
      scope: 'global',
    });
  });

  afterEach(jest.clearAllMocks);

  describe('findSchemas', () => {
    it('returns runtime settings schema definitions', () => {
      const getAllSchemaDefinitionsSpy = jest.spyOn(
        settingService,
        'getAllSchemaDefinitions',
      );
      const result = settingController.findSchemas();

      expect(getAllSchemaDefinitionsSpy).toHaveBeenCalled();
      expect(result.contact).toBeDefined();
      expect(result.contact.scope).toBe('global');
      expect(result.contact.schema.$schema).toBe(
        'http://json-schema.org/draft-07/schema#',
      );
    });
  });

  describe('find', () => {
    it('Should return an array of ordered Settings by group ', async () => {
      jest.spyOn(settingService, 'find');
      const options = {
        where: {},
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

      expect(settingService.updateOne).toHaveBeenCalledWith(id, payload);
      expect(result).toEqualPayload(
        {
          ...expectedSettings.find(
            (settingFixture) =>
              settingFixture.label === 'contact_email_recipient',
          ),
          value: payload.value,
        },
        ['id', 'createdAt', 'updatedAt'],
      );
    });

    it('Should validate value against runtime schema before update', async () => {
      const setting = (await settingService.findOne({
        where: { label: 'contact_email_recipient' },
      })) as Setting;

      await expect(
        settingController.updateOne(setting.id, { value: 123 as any }),
      ).rejects.toThrow(
        'Invalid value provided for setting "contact.contact_email_recipient".',
      );
    });
  });
});
