/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { LoggerService } from '@hexabot/logger';
import { TestingModule } from '@nestjs/testing';

import { ChannelService } from '@/channel/channel.service';
import LocalStorageHelper from '@/extensions/helpers/local-storage/index.helper';
import { HelperService } from '@/helper/helper.service';
import { Setting } from '@/setting/dto/setting.dto';
import { SettingService } from '@/setting/services/setting.service';
import { installSettingFixturesTypeOrm } from '@/utils/test/fixtures/setting';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { CleanupService } from './cleanup.service';
import { TNamespace } from './types';

const channelServiceMock = {
  getAll: jest.fn().mockReturnValue([]),
};

jest.mock('@/channel/channel.service', () => ({
  ChannelService: jest.fn().mockImplementation(() => channelServiceMock),
}));

describe('CleanupService', () => {
  let module: TestingModule;
  let initialSettings: Setting[];
  let helperService: HelperService;
  let cleanupService: CleanupService;
  let settingService: SettingService;
  let loggerService: LoggerService;

  const sortSettings = (settings: Setting[]) =>
    [...settings].sort((a, b) => {
      const groupCompare = a.group.localeCompare(b.group);
      if (groupCompare !== 0) {
        return groupCompare;
      }

      return a.label.localeCompare(b.label);
    });

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [
        CleanupService,
        {
          provide: ChannelService,
          useValue: channelServiceMock,
        },
      ],
      typeorm: {
        fixtures: installSettingFixturesTypeOrm,
      },
    });

    module = testing.module;

    [cleanupService, settingService, helperService] = await testing.getMocks([
      CleanupService,
      SettingService,
      HelperService,
    ]);

    [loggerService] = await testing.resolveMocks([LoggerService]);

    initialSettings = await settingService.findAll();

    helperService.register(
      new LocalStorageHelper(settingService, helperService, loggerService),
    );
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (settingService) {
      await settingService.clearCache();
    }
  });

  describe('delete', () => {
    it('should delete all the unregistered settings with a group suffix `_channel` or/and `_helper`', async () => {
      const registeredNamespaces = [
        ...cleanupService.getChannelNamespaces(),
        ...cleanupService.getHelperNamespaces(),
      ];
      expect(registeredNamespaces).toContain('local_storage_helper');

      await cleanupService.pruneExtensionSettings();
      const cleanSettings = await settingService.findAll();
      const filteredSettings = initialSettings.filter(
        ({ group }) =>
          !/_(channel|helper)$/.test(group) !==
          registeredNamespaces.includes(group as TNamespace),
      );

      expect(sortSettings(cleanSettings)).toEqualPayload(
        sortSettings(filteredSettings),
      );
    });
  });
});
