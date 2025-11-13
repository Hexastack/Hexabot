/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';

import { I18nService } from '@/i18n/services/i18n.service';
import {
  installSettingFixturesTypeOrm,
  settingFixtures,
} from '@hexabot/dev/fixtures/setting';
import { closeTypeOrmConnections } from '@hexabot/dev/test';
import { buildTestingMocks } from '@hexabot/dev/utils';

import { Setting } from '../dto/setting.dto';
import { SettingOrmEntity } from '../entities/setting.entity';
import { SettingService } from '../services/setting.service';

import { SettingController } from './setting.controller';

const expectedSettings = settingFixtures.map((s) => ({
  translatable: false,
  ...s,
}));

describe('SettingController', () => {
  let settingController: SettingController;
  let settingService: SettingService;
  let module: TestingModule;

  beforeAll(async () => {
    const { module: testingModule, getMocks } = await buildTestingMocks({
      autoInjectFrom: ['controllers'],
      controllers: [SettingController],
      providers: [
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
      ],
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
});
