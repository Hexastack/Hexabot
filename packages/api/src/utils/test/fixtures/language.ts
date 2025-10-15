/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import mongoose from 'mongoose';
import { DataSource } from 'typeorm';

import { LanguageCreateDto } from '@/i18n/dto/language.dto';
import { Language } from '@/i18n/entities/language.entity';
import { LanguageModel } from '@/i18n/schemas/language.schema';

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

export const installLanguageFixtures = async () => {
  const Language = mongoose.model(LanguageModel.name, LanguageModel.schema);
  return await Language.insertMany(languageFixtures);
};

export const installLanguageFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  const repository = dataSource.getRepository(Language);
  const entities = repository.create(languageFixtures);
  await repository.save(entities);
};
