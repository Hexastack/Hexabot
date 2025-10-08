/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import LocalStorageHelper from '@/extensions/helpers/local-storage/index.helper';
import { HelperService } from '@/helper/helper.service';
import { LoggerService } from '@/logger/logger.service';
import { Setting } from '@/setting/schemas/setting.schema';
import { SettingService } from '@/setting/services/setting.service';
import { installSettingFixtures } from '@/utils/test/fixtures/setting';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { CleanupService } from './cleanup.service';
import { TNamespace } from './types';

describe('CleanupService', () => {
  let initialSettings: Setting[];
  let helperService: HelperService;
  let cleanupService: CleanupService;
  let settingService: SettingService;

  beforeAll(async () => {
    const { getMocks, resolveMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installSettingFixtures)],
      providers: [CleanupService],
    });
    [cleanupService, settingService, helperService] = await getMocks([
      CleanupService,
      SettingService,
      HelperService,
    ]);

    const [loggerService] = await resolveMocks([LoggerService]);
    initialSettings = await settingService.findAll();

    helperService.register(
      new LocalStorageHelper(settingService, helperService, loggerService),
    );
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('delete', () => {
    it('should delete all the unregistered settings with a group suffix `_channel` or/and `_helper`', async () => {
      const registeredNamespaces = [
        ...cleanupService.getChannelNamespaces(),
        ...cleanupService.getHelperNamespaces(),
      ];

      await cleanupService.pruneExtensionSettings();
      const cleanSettings = await settingService.findAll();
      const filteredSettings = initialSettings.filter(
        ({ group }) =>
          !/_(channel|helper)$/.test(group) !==
          registeredNamespaces.includes(group as TNamespace),
      );

      expect(cleanSettings).toEqualPayload(filteredSettings);
    });
  });
});
