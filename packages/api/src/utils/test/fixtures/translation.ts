/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import mongoose from 'mongoose';
import { DataSource } from 'typeorm';

import { TranslationUpdateDto } from '@/i18n/dto/translation.dto';
import { Translation } from '@/i18n/entities/translation.entity';
import { TranslationModel } from '@/i18n/schemas/translation.schema';

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

export const installTranslationFixtures = async () => {
  const Translation = mongoose.model(
    TranslationModel.name,
    TranslationModel.schema,
  );
  return await Translation.insertMany(translationFixtures);
};

export const installTranslationFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  const repository = dataSource.getRepository(Translation);
  const entities = repository.create(translationFixtures);
  await repository.save(entities);
};
