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

import { Setting } from '../dto/setting.dto';
import { SettingRepository } from '../repositories/setting.repository';
import { SettingType } from '../types';

import { SettingService } from './setting.service';

describe('SettingService', () => {
  let settingService: SettingService;
  let settingRepository: SettingRepository;
  let module: TestingModule;
  const makeSetting = (overrides: Partial<Setting>): Setting => {
    const setting = new Setting();
    Object.assign(setting, {
      id: '',
      group: 'group',
      label: 'label',
      value: '',
      type: SettingType.text,
      createdAt: new Date(),
      updatedAt: new Date(),
      subgroup: undefined,
      options: undefined,
      config: undefined,
      weight: undefined,
      translatable: undefined,
      ...overrides,
    });
    return setting;
  };

  beforeAll(async () => {
    const { module: testingModule, getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [
        SettingService,
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
    [settingService, settingRepository] = await getMocks([
      SettingService,
      SettingRepository,
    ]);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await settingService.clearCache();
  });

  describe('load', () => {
    it('Should return loaded settings', async () => {
      jest.spyOn(settingRepository, 'findAll');
      const result = await settingService.load();

      expect(settingRepository.findAll).toHaveBeenCalled();
      expect(result).toEqualPayload(
        settingService.group(
          settingFixtures.map((fixture) => makeSetting(fixture)),
        ),
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

  describe('buildTree', () => {
    it('should return an empty object when settings are empty', () => {
      expect(settingService.buildTree([])).toEqual({});
    });

    it('should categorize settings by group and map labels to values', () => {
      const settings = [
        { group: 'group1', label: 'setting1', value: 'value1' },
        { group: 'group1', label: 'setting2', value: 'value2' },
        { group: 'group2', label: 'setting1', value: 'value3' },
      ].map((s) => makeSetting(s));
      expect(settingService.buildTree(settings)).toEqualPayload({
        group1: { setting1: 'value1', setting2: 'value2' },
        group2: { setting1: 'value3' },
      });
    });

    it('should handle undefined group as "undefinedGroup"', () => {
      const settings = [
        makeSetting({ label: 'setting1', value: 'value1', group: '' }),
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
      ].map((s) => makeSetting(s));
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

  describe('getAllowedOrigins', () => {
    it('should return a set of unique origins from allowed_domains settings', async () => {
      const mockSettings = [
        makeSetting({
          label: 'allowed_domains',
          value: 'https://example.com,https://test.com',
        }),
        makeSetting({
          label: 'allowed_domains',
          value: 'https://example.com,https://another.com',
        }),
      ];

      jest.spyOn(settingService, 'find').mockResolvedValue(mockSettings);

      const result = await settingService.getAllowedOrigins();

      expect(settingService.find).toHaveBeenCalledWith({
        where: { label: 'allowed_domains' },
      });
      expect(result).toEqual([
        '*',
        'https://example.com',
        'https://test.com',
        'https://another.com',
      ]);
    });

    it('should return the config allowed cors only if no settings are found', async () => {
      jest.spyOn(settingService, 'find').mockResolvedValue([]);

      const result = await settingService.getAllowedOrigins();

      expect(settingService.find).toHaveBeenCalledWith({
        where: { label: 'allowed_domains' },
      });
      expect(result).toEqual(['*']);
    });

    it('should handle settings with empty values', async () => {
      const mockSettings = [
        makeSetting({ label: 'allowed_domains', value: '' }),
        makeSetting({
          label: 'allowed_domains',
          value: 'https://example.com',
        }),
      ];

      jest.spyOn(settingService, 'find').mockResolvedValue(mockSettings);

      const result = await settingService.getAllowedOrigins();

      expect(settingService.find).toHaveBeenCalledWith({
        where: { label: 'allowed_domains' },
      });
      expect(result).toEqual(['*', 'https://example.com']);
    });
  });
});
