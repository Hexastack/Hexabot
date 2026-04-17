/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

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

    initialSettings = await settingService.findAll();

    helperService.register(new LocalStorageHelper());
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
    it('should delete unregistered extension settings using subgroup markers and purge legacy suffixed groups', async () => {
      const registeredChannels = cleanupService.getChannelGroups();
      const registeredHelpers = cleanupService.getHelperGroups();
      const legacySuffixPattern = /-(channel|helper)$/;

      expect(registeredHelpers).toContain('local-storage');

      await cleanupService.pruneExtensionSettings();
      const cleanSettings = await settingService.findAll();
      const filteredSettings = initialSettings.filter(({ group, subgroup }) => {
        if (legacySuffixPattern.test(group)) {
          return false;
        }

        if (subgroup === 'channel') {
          return registeredChannels.includes(group as string);
        }

        if (subgroup === 'helper') {
          return registeredHelpers.includes(group as string);
        }

        return true;
      });

      expect(sortSettings(cleanSettings)).toEqualPayload(
        sortSettings(filteredSettings),
      );
    });
  });
});
