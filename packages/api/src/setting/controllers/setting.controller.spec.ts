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
} from '@/utils/test/fixtures/setting';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { Setting } from '../entities/setting.entity';
import { SettingService } from '../services/setting.service';

import { SettingController } from './setting.controller';

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
    it('Should return an array of ordered by group Settings', async () => {
      jest.spyOn(settingService, 'find');
      const result = await settingController.find(
        {},
        {
          sort: ['weight', 'asc'],
          limit: undefined,
          skip: undefined,
        },
      );

      expect(settingService.find).toHaveBeenCalled();
      expect(result).toEqualPayload(settingFixtures, [
        'id',
        'createdAt',
        'updatedAt',
        'subgroup',
        'translatable',
        'options',
        'config',
      ]);
    });
  });

  describe('updateOne', () => {
    it('Should update and return a specific Setting by id', async () => {
      jest.spyOn(settingService, 'updateOne');
      const payload = {
        value: 'updated setting value',
      };
      const { id } = (await settingService.findOne({
        value: 'admin@example.com',
      })) as Setting;
      const result = await settingController.updateOne(id, payload);

      expect(settingService.updateOne).toHaveBeenCalledWith(id, payload);
      expect(result).toEqualPayload(
        {
          ...settingFixtures.find(
            (settingFixture) => settingFixture.value === 'admin@example.com',
          ),
          value: payload.value,
        },
        [
          'id',
          'createdAt',
          'updatedAt',
          'subgroup',
          'translatable',
          'options',
          'config',
        ],
      );
    });
  });
});
