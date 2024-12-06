/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';

import { I18nService } from '@/i18n/services/i18n.service';
import { LoggerService } from '@/logger/logger.service';
import {
  installSettingFixtures,
  settingFixtures,
} from '@/utils/test/fixtures/setting';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { SettingRepository } from '../repositories/setting.repository';
import { SettingModel } from '../schemas/setting.schema';
import { SettingSeeder } from '../seeds/setting.seed';
import { SettingService } from '../services/setting.service';

import { SettingController } from './setting.controller';

describe('SettingController', () => {
  let settingController: SettingController;
  let settingService: SettingService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [SettingController],
      imports: [
        rootMongooseTestModule(installSettingFixtures),
        MongooseModule.forFeature([SettingModel]),
      ],
      providers: [
        SettingService,
        SettingRepository,
        SettingSeeder,
        LoggerService,
        EventEmitter2,
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    settingController = module.get<SettingController>(SettingController);
    settingService = module.get<SettingService>(SettingService);
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
      const id = (await settingService.findOne({ value: 'admin@example.com' }))
        .id;
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
