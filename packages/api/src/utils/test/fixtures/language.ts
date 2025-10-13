/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import mongoose from 'mongoose';

import { LanguageCreateDto } from '@/i18n/dto/language.dto';
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
