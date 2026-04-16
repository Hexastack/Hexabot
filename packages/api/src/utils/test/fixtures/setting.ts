/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource } from 'typeorm';

import { SettingCreateDto } from '@/setting/dto/setting.dto';
import { SettingOrmEntity } from '@/setting/entities/setting.entity';
import { getRandom } from '@/utils/helpers/safeRandom';

export const settingFixtures: SettingCreateDto[] = [
  {
    group: 'chatbot_settings',
    label: 'default_storage_helper',
    value: 'local-storage-helper',
  },
  {
    group: 'contact',
    label: 'contact_email_recipient',
    value: 'admin@example.com',
  },
  {
    group: 'contact',
    label: 'company_name',
    value: 'Your company name',
  },
  {
    group: 'contact',
    label: 'company_phone',
    value: '(+999) 9999 9999 999',
  },
  {
    group: 'contact',
    label: 'company_email',
    value: 'contact[at]mycompany.com',
  },
  {
    group: 'contact',
    label: 'company_address1',
    value: '71 Pilgrim Avenue',
  },
  {
    group: 'contact',
    label: 'company_address2',
    value: '',
  },
  {
    group: 'contact',
    label: 'company_city',
    value: 'Chevy Chase',
  },
  {
    group: 'contact',
    label: 'company_zipcode',
    value: '85705',
  },
  {
    group: 'contact',
    label: 'company_state',
    value: 'Orlando',
  },
  {
    group: 'contact',
    label: 'company_country',
    value: 'US',
  },
  {
    group: `${getRandom()}-channel`,
    label: `${getRandom()}`,
    value: '',
  },
  {
    group: `${getRandom()}-helper`,
    label: `${getRandom()}`,
    value: '',
  },
  {
    group: `${getRandom()}-channel`,
    label: `${getRandom()}`,
    value: '',
  },
  {
    group: `${getRandom()}-helper`,
    label: `${getRandom()}`,
    value: '',
  },
  {
    group: 'local-storage-helper',
    label: 'default storage helper label',
    value: 'local-storage-helper',
  },
];

export const installSettingFixturesTypeOrm = async (dataSource: DataSource) => {
  const repository = dataSource.getRepository(SettingOrmEntity);
  const entities = repository.create(settingFixtures);
  await repository.save(entities);
};
