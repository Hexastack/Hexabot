/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource } from 'typeorm';

import { TranslationUpdateDto } from '@hexabot/i18n/dto/translation.dto';
import { TranslationOrmEntity } from '@hexabot/i18n/entities/translation.entity';

export const translationFixtures: TranslationUpdateDto[] = [
  {
    str: 'Welcome',
    translations: {
      en: 'Welcome',
      fr: 'Bienvenue',
    },
    // translated: 100,
  },
];

export const installTranslationFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  const repository = dataSource.getRepository(TranslationOrmEntity);
  const entities = repository.create(translationFixtures);
  await repository.save(entities);
};
