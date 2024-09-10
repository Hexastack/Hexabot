/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';

import { ExtendedI18nService } from '@/extended-i18n.service';
import { LoggerService } from '@/logger/logger.service';
import {
  installSettingFixtures,
  settingFixtures,
} from '@/utils/test/fixtures/setting';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { SettingService } from './setting.service';
import { SettingRepository } from '../repositories/setting.repository';
import { Setting, SettingModel } from '../schemas/setting.schema';
import { SettingType } from '../schemas/types';
import { SettingSeeder } from '../seeds/setting.seed';

describe('SettingService', () => {
  let settingService: SettingService;
  let settingRepository: SettingRepository;
  const commonAttributes = {
    type: SettingType.text,
    id: '',
    createdAt: undefined,
    updatedAt: undefined,
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installSettingFixtures),
        MongooseModule.forFeature([SettingModel]),
      ],
      providers: [
        SettingService,
        SettingRepository,
        SettingSeeder,
        EventEmitter2,
        {
          provide: ExtendedI18nService,
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
        LoggerService,
      ],
    }).compile();

    settingService = module.get<SettingService>(SettingService);
    settingRepository = module.get<SettingRepository>(SettingRepository);
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('load', () => {
    it('Should return loaded settings', async () => {
      jest.spyOn(settingRepository, 'findAll');
      const result = await settingService.load();

      expect(settingRepository.findAll).toHaveBeenCalled();
      expect(result).toEqualPayload(
        settingService.group(settingFixtures as Setting[]),
      );
    });
  });

  describe('buildTree', () => {
    it('should return an empty object when settings are empty', () => {
      expect(settingService.buildTree([])).toEqual({});
    });

    it('should categorize settings by group and map labels to values', () => {
      const settings: Setting[] = [
        { group: 'group1', label: 'setting1', value: 'value1' },
        { group: 'group1', label: 'setting2', value: 'value2' },
        { group: 'group2', label: 'setting1', value: 'value3' },
      ].map((s) => ({ ...commonAttributes, ...s }));
      expect(settingService.buildTree(settings)).toEqualPayload({
        group1: { setting1: 'value1', setting2: 'value2' },
        group2: { setting1: 'value3' },
      });
    });

    it('should handle undefined group as "undefinedGroup"', () => {
      const settings: Setting[] = [
        {
          ...commonAttributes,
          label: 'setting1',
          value: 'value1',
          group: '',
        },
      ];
      expect(settingService.buildTree(settings)).toEqualPayload({
        undefinedGroup: { setting1: 'value1' },
      });
    });
  });

  describe('group', () => {
    it('should return an empty object when settings are empty', () => {
      expect(settingService.group([])).toEqual({});
    });

    it('should group settings by their group property', () => {
      const settings = [
        { group: 'group1', label: 'setting1', value: 'value1' },
        { group: 'group1', label: 'setting2', value: 'value2' },
        { group: 'group2', label: 'setting1', value: 'value3' },
      ].map((s) => ({ ...commonAttributes, ...s }));
      expect(settingService.group(settings)).toEqualPayload({
        group1: [
          { group: 'group1', label: 'setting1', type: 'text', value: 'value1' },
          { group: 'group1', label: 'setting2', type: 'text', value: 'value2' },
        ],
        group2: [
          { group: 'group2', label: 'setting1', type: 'text', value: 'value3' },
        ],
      });
    });
  });
});
