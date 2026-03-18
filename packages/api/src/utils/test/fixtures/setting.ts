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
    schema: { type: 'string', default: 'local-storage-helper' },
    weight: 1,
  },
  {
    group: 'contact',
    label: 'contact_email_recipient',
    schema: { type: 'string', default: 'admin@example.com' },
    weight: 1,
  },
  {
    group: 'contact',
    label: 'company_name',
    schema: { type: 'string', default: 'Your company name' },
    weight: 2,
  },
  {
    group: 'contact',
    label: 'company_phone',
    schema: { type: 'string', default: '(+999) 9999 9999 999' },
    weight: 3,
  },
  {
    group: 'contact',
    label: 'company_email',
    schema: { type: 'string', default: 'contact[at]mycompany.com' },
    weight: 4,
  },
  {
    group: 'contact',
    label: 'company_address1',
    schema: { type: 'string', default: '71 Pilgrim Avenue' },
    weight: 5,
  },
  {
    group: 'contact',
    label: 'company_address2',
    schema: { type: 'string', default: '' },
    weight: 6,
  },
  {
    group: 'contact',
    label: 'company_city',
    schema: { type: 'string', default: 'Chevy Chase' },
    weight: 7,
  },
  {
    group: 'contact',
    label: 'company_zipcode',
    schema: { type: 'string', default: '85705' },
    weight: 8,
  },
  {
    group: 'contact',
    label: 'company_state',
    schema: { type: 'string', default: 'Orlando' },
    weight: 9,
  },
  {
    group: 'contact',
    label: 'company_country',
    schema: { type: 'string', default: 'US' },
    weight: 10,
  },
  {
    group: `${getRandom()}_channel`,
    label: `${getRandom()}`,
    schema: { type: 'string', default: '' },
    weight: 11,
  },
  {
    group: `${getRandom()}_helper`,
    label: `${getRandom()}`,
    schema: { type: 'string', default: '' },
    weight: 12,
  },
  {
    group: `${getRandom()}_channel`,
    label: `${getRandom()}`,
    schema: { type: 'string', default: '' },
    weight: 13,
  },
  {
    group: `${getRandom()}_helper`,
    label: `${getRandom()}`,
    schema: { type: 'string', default: '' },
    weight: 14,
    translatable: true,
  },
  {
    group: 'local_storage_helper',
    label: 'default storage helper label',
    schema: { type: 'string', default: 'local-storage-helper' },
    weight: 15,
  },
];

export const installSettingFixturesTypeOrm = async (dataSource: DataSource) => {
  const repository = dataSource.getRepository(SettingOrmEntity);
  const entities = settingFixtures.map((fixture) =>
    Object.assign(new SettingOrmEntity(), fixture),
  );
  await repository.save(entities);
};
