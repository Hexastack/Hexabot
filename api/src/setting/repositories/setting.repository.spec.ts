/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { installSettingFixtures } from '@/utils/test/fixtures/setting';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { Setting } from '../schemas/setting.schema';
import { SettingType } from '../schemas/types';

import { SettingRepository } from './setting.repository';

describe('SettingRepository', () => {
  let settingRepository: SettingRepository;
  let settingModel: Model<Setting>;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installSettingFixtures)],
      providers: [SettingRepository],
    });
    [settingRepository, settingModel] = await getMocks([
      SettingRepository,
      getModelToken(Setting.name),
    ]);
  });

  afterEach(jest.clearAllMocks);

  afterAll(closeInMongodConnection);

  describe('preCreateValidate', () => {
    it('should validate setting value during creation', async () => {
      const mockSetting = new settingModel({
        type: SettingType.text,
        value: 'Sample Text',
      });
      jest.spyOn(settingRepository, 'validateSettingValue');

      await settingRepository.preCreateValidate(mockSetting);

      expect(settingRepository['validateSettingValue']).toHaveBeenCalledWith(
        SettingType.text,
        'Sample Text',
      );
    });

    it('should throw an error for invalid value type', async () => {
      const mockSetting = new settingModel({
        type: SettingType.checkbox,
        value: 'Invalid Value',
      });

      await expect(
        settingRepository.preCreateValidate(mockSetting),
      ).rejects.toThrow('Setting Model : Value must be a boolean!');
    });
  });

  describe('preUpdateValidate', () => {
    it('should validate updated setting value', async () => {
      const criteria = { _id: '123' };
      const updates = {
        $set: { value: 'Updated Text' },
      };

      jest.spyOn(settingRepository, 'findOne').mockResolvedValue({
        type: SettingType.text,
      } as any);

      await settingRepository.preUpdateValidate(criteria, updates);

      expect(settingRepository.findOne).toHaveBeenCalledWith(criteria);
      expect(settingRepository['validateSettingValue']).toHaveBeenCalledWith(
        SettingType.text,
        'Updated Text',
      );
    });
  });

  describe('postUpdate', () => {
    it('should emit an event after updating a setting', async () => {
      const mockSetting = new settingModel({
        group: 'general',
        label: 'theme',
      });

      jest.spyOn(settingRepository.eventEmitter, 'emit');

      await settingRepository.postUpdate({} as any, mockSetting);

      expect(settingRepository.eventEmitter.emit).toHaveBeenCalledWith(
        'hook:general:theme',
        mockSetting,
      );
    });
  });

  describe('validateSettingValue', () => {
    it('should validate value types correctly', () => {
      expect(() =>
        settingRepository['validateSettingValue'](
          SettingType.text,
          'Valid Text',
        ),
      ).not.toThrow();

      expect(() =>
        settingRepository['validateSettingValue'](SettingType.checkbox, true),
      ).not.toThrow();

      expect(() =>
        settingRepository['validateSettingValue'](SettingType.number, 123),
      ).not.toThrow();

      expect(() =>
        settingRepository['validateSettingValue'](SettingType.text, 123),
      ).toThrow('Setting Model : Value must be a string!');
    });
  });

  describe('validateSettingValue', () => {
    const testCases = [
      {
        type: SettingType.text,
        value: 123,
        error: 'Setting Model : Value must be a string!',
      },
      {
        type: SettingType.checkbox,
        value: 'true',
        error: 'Setting Model : Value must be a boolean!',
      },
      {
        type: SettingType.number,
        value: '123',
      },
      {
        type: SettingType.multiple_text,
        value: ['valid', 123],
      },
      {
        type: SettingType.attachment,
        value: 123,
      },
      {
        type: SettingType.secret,
        value: 123,
      },
      {
        type: SettingType.select,
        value: 123,
      },
      {
        type: SettingType.multiple_attachment,
        value: [123, 'valid'],
      },
    ];

    testCases.forEach(({ type, value }) => {
      it(`should throw an error when value type does not match SettingType.${type}`, () => {
        expect(() =>
          settingRepository['validateSettingValue'](type, value),
        ).toThrow();
      });
    });
  });
});
