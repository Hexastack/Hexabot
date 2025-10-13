/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import mongoose from 'mongoose';

import { TranslationUpdateDto } from '@/i18n/dto/translation.dto';
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
