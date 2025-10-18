/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import mongoose from 'mongoose';
import { DataSource } from 'typeorm';

import { SettingCreateDto } from '@/setting/dto/setting.dto';
import { SettingOrmEntity } from '@/setting/entities/setting.entity';
import { SettingModel } from '@/setting/schemas/setting.schema';
import { SettingType } from '@/setting/types';
import { getRandom } from '@/utils/helpers/safeRandom';

export const settingFixtures: SettingCreateDto[] = [
  {
    group: 'chatbot_settings',
    label: 'default_storage_helper',
    value: 'local-storage-helper',
    type: SettingType.text,
    weight: 1,
  },
  {
    group: 'contact',
    label: 'contact_email_recipient',
    value: 'admin@example.com',
    type: SettingType.text,
    weight: 1,
  },
  {
    group: 'contact',
    label: 'company_name',
    value: 'Your company name',
    type: SettingType.text,
    weight: 2,
  },
  {
    group: 'contact',
    label: 'company_phone',
    value: '(+999) 9999 9999 999',
    type: SettingType.text,
    weight: 3,
  },
  {
    group: 'contact',
    label: 'company_email',
    value: 'contact[at]mycompany.com',
    type: SettingType.text,
    weight: 4,
  },
  {
    group: 'contact',
    label: 'company_address1',
    value: '71 Pilgrim Avenue',
    type: SettingType.text,
    weight: 5,
  },
  {
    group: 'contact',
    label: 'company_address2',
    value: '',
    type: SettingType.text,
    weight: 6,
  },
  {
    group: 'contact',
    label: 'company_city',
    value: 'Chevy Chase',
    type: SettingType.text,
    weight: 7,
  },
  {
    group: 'contact',
    label: 'company_zipcode',
    value: '85705',
    type: SettingType.text,
    weight: 8,
  },
  {
    group: 'contact',
    label: 'company_state',
    value: 'Orlando',
    type: SettingType.text,
    weight: 9,
  },
  {
    group: 'contact',
    label: 'company_country',
    value: 'US',
    type: SettingType.text,
    weight: 10,
  },
  {
    group: `${getRandom()}_channel`,
    label: `${getRandom()}`,
    value: '',
    type: SettingType.text,
    weight: 11,
  },
  {
    group: `${getRandom()}_helper`,
    label: `${getRandom()}`,
    value: '',
    type: SettingType.text,
    weight: 12,
  },
  {
    group: `${getRandom()}_channel`,
    label: `${getRandom()}`,
    value: '',
    type: SettingType.text,
    weight: 13,
  },
  {
    group: `${getRandom()}_helper`,
    label: `${getRandom()}`,
    value: '',
    type: SettingType.text,
    weight: 14,
  },
  {
    group: 'local_storage_helper',
    label: 'default storage helper label',
    value: 'local-storage-helper',
    type: SettingType.text,
    weight: 15,
  },
];

export const installSettingFixtures = async () => {
  const Setting = mongoose.model(SettingModel.name, SettingModel.schema);
  return await Setting.insertMany(settingFixtures);
};

export const installSettingFixturesTypeOrm = async (dataSource: DataSource) => {
  const repository = dataSource.getRepository(SettingOrmEntity);
  const entities = repository.create(settingFixtures);
  await repository.save(entities);
};
