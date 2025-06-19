/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { I18nService } from '@/i18n/services/i18n.service';
import {
  installSettingFixtures,
  settingFixtures,
} from '@/utils/test/fixtures/setting';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { Setting } from '../schemas/setting.schema';
import { SettingService } from '../services/setting.service';

import { SettingController } from './setting.controller';

describe('SettingController', () => {
  let settingController: SettingController;
  let settingService: SettingService;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['controllers'],
      controllers: [SettingController],
      imports: [rootMongooseTestModule(installSettingFixtures)],
      providers: [
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
      ],
    });
    [settingController, settingService] = await getMocks([
      SettingController,
      SettingService,
    ]);
  });

  afterAll(closeInMongodConnection);

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
        ['id', 'createdAt', 'updatedAt', 'subgroup', 'translatable'],
      );
    });
  });
});
