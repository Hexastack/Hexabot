/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { promises as fs } from 'fs';
import path from 'path';

import { OnModuleInit } from '@nestjs/common';
import { I18nJsonLoader, I18nTranslation } from 'nestjs-i18n';
import { Observable } from 'rxjs';

import { ExtensionName, HyphenToUnderscore } from '../types/extension';

export abstract class Extension implements OnModuleInit {
  private translations: I18nTranslation | Observable<I18nTranslation>;

  constructor(public readonly name: ExtensionName) {}

  abstract getPath(): string;

  getName() {
    return this.name;
  }

  getNamespace<N extends ExtensionName = ExtensionName>() {
    return this.name.replaceAll('-', '_') as HyphenToUnderscore<N>;
  }

  async onModuleInit() {
    // Load i18n
    const i18nPath = path.join(this.getPath(), 'i18n');
    try {
      // Check if the i18n directory exists
      await fs.access(i18nPath);

      // Load and merge translations
      const i18nLoader = new I18nJsonLoader({ path: i18nPath });
      this.translations = await i18nLoader.load();
    } catch (error) {
      // If the i18n folder does not exist or error in reading, skip this folder
    }
  }

  getTranslations() {
    return this.translations;
  }
}
