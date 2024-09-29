/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
