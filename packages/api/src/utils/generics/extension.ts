/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
    } catch (_error) {
      // If the i18n folder does not exist or error in reading, skip this folder
    }
  }

  getTranslations() {
    return this.translations;
  }
}
