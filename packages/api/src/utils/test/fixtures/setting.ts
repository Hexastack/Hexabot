/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource } from 'typeorm';

import { SettingCreateDto } from '@/setting/dto/setting.dto';
import { SettingOrmEntity } from '@/setting/entities/setting.entity';
import { createTextSettingSchema } from '@/setting/utils/setting-schema-definition.utils';
import { getRandom } from '@/utils/helpers/safeRandom';

export const settingFixtures: SettingCreateDto[] = [
  {
    group: 'chatbot_settings',
    label: 'default_storage_helper',
    schema: createTextSettingSchema({ defaultValue: 'local-storage-helper' }),
    weight: 1,
  },
  {
    group: 'contact',
    label: 'contact_email_recipient',
    schema: createTextSettingSchema({ defaultValue: 'admin@example.com' }),
    weight: 1,
  },
  {
    group: 'contact',
    label: 'company_name',
    schema: createTextSettingSchema({ defaultValue: 'Your company name' }),
    weight: 2,
  },
  {
    group: 'contact',
    label: 'company_phone',
    schema: createTextSettingSchema({ defaultValue: '(+999) 9999 9999 999' }),
    weight: 3,
  },
  {
    group: 'contact',
    label: 'company_email',
    schema: createTextSettingSchema({
      defaultValue: 'contact[at]mycompany.com',
    }),
    weight: 4,
  },
  {
    group: 'contact',
    label: 'company_address1',
    schema: createTextSettingSchema({ defaultValue: '71 Pilgrim Avenue' }),
    weight: 5,
  },
  {
    group: 'contact',
    label: 'company_address2',
    schema: createTextSettingSchema({ defaultValue: '' }),
    weight: 6,
  },
  {
    group: 'contact',
    label: 'company_city',
    schema: createTextSettingSchema({ defaultValue: 'Chevy Chase' }),
    weight: 7,
  },
  {
    group: 'contact',
    label: 'company_zipcode',
    schema: createTextSettingSchema({ defaultValue: '85705' }),
    weight: 8,
  },
  {
    group: 'contact',
    label: 'company_state',
    schema: createTextSettingSchema({ defaultValue: 'Orlando' }),
    weight: 9,
  },
  {
    group: 'contact',
    label: 'company_country',
    schema: createTextSettingSchema({ defaultValue: 'US' }),
    weight: 10,
  },
  {
    group: `${getRandom()}_channel`,
    label: `${getRandom()}`,
    schema: createTextSettingSchema({ defaultValue: '' }),
    weight: 11,
  },
  {
    group: `${getRandom()}_helper`,
    label: `${getRandom()}`,
    schema: createTextSettingSchema({ defaultValue: '' }),
    weight: 12,
  },
  {
    group: `${getRandom()}_channel`,
    label: `${getRandom()}`,
    schema: createTextSettingSchema({ defaultValue: '' }),
    weight: 13,
  },
  {
    group: `${getRandom()}_helper`,
    label: `${getRandom()}`,
    schema: createTextSettingSchema({ defaultValue: '' }),
    weight: 14,
    translatable: true,
  },
  {
    group: 'local_storage_helper',
    label: 'default storage helper label',
    schema: createTextSettingSchema({ defaultValue: 'local-storage-helper' }),
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
