/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MongooseModule } from '@nestjs/mongoose';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { ChannelService } from '@/channel/channel.service';
import { SubscriberRepository } from '@/chat/repositories/subscriber.repository';
import { SubscriberModel } from '@/chat/schemas/subscriber.schema';
import { SubscriberService } from '@/chat/services/subscriber.service';
import LocalStorageHelper from '@/extensions/helpers/local-storage/index.helper';
import { HelperService } from '@/helper/helper.service';
import { LoggerService } from '@/logger/logger.service';
import { SettingRepository } from '@/setting/repositories/setting.repository';
import { Setting, SettingModel } from '@/setting/schemas/setting.schema';
import { SettingSeeder } from '@/setting/seeds/setting.seed';
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
      imports: [
        rootMongooseTestModule(installSettingFixtures),
        MongooseModule.forFeature([
          SettingModel,
          SubscriberModel,
          AttachmentModel,
        ]),
      ],
      providers: [
        CleanupService,
        HelperService,
        SettingService,
        SettingRepository,
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        SettingSeeder,
        SubscriberService,
        SubscriberRepository,
        AttachmentService,
        AttachmentRepository,
        ChannelService,
      ],
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
