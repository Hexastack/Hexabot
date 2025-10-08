/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { LanguageCreateDto } from '../dto/language.dto';

export const languageModels: LanguageCreateDto[] = [
  {
    title: 'English',
    code: 'en',
    isRTL: false,
    isDefault: true,
  },
  {
    title: 'Français',
    code: 'fr',
    isRTL: false,
  },
];
