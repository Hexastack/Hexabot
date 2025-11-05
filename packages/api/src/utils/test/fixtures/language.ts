/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource } from 'typeorm';

import { LanguageCreateDto } from '@/i18n/dto/language.dto';
import { LanguageOrmEntity } from '@/i18n/entities/language.entity';

export const languageFixtures: LanguageCreateDto[] = [
  {
    title: 'English',
    code: 'en',
    isDefault: true,
    isRTL: false,
  },
  {
    title: 'Français',
    code: 'fr',
    isDefault: false,
    isRTL: false,
  },
];

export const installLanguageFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  const repository = dataSource.getRepository(LanguageOrmEntity);
  LanguageOrmEntity.registerEntityManagerProvider(() => repository.manager);

  const existing = await repository.find();
  if (existing.length) {
    return existing;
  }

  const entities = repository.create(languageFixtures);

  return await repository.save(entities);
};
