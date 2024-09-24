/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import {
  DEFAULT_LANGUAGE_CACHE_KEY,
  LANGUAGES_CACHE_KEY,
} from '@/utils/constants/cache';
import { Cacheable } from '@/utils/decorators/cacheable.decorator';
import { BaseService } from '@/utils/generics/base-service';

import { LanguageRepository } from '../repositories/language.repository';
import { Language } from '../schemas/language.schema';

@Injectable()
export class LanguageService extends BaseService<Language> {
  constructor(
    readonly repository: LanguageRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    super(repository);
  }

  /**
   * Retrieves all available languages from the repository.
   *
   * @returns A promise that resolves to an object where each key is a language code
   * and the corresponding value is the `Language` object.
   */
  @Cacheable(LANGUAGES_CACHE_KEY)
  async getLanguages() {
    const languages = await this.findAll();
    return languages.reduce((acc, curr) => {
      return {
        ...acc,
        [curr.code]: curr,
      };
    }, {});
  }

  /**
   * Retrieves the default language from the repository.
   *
   * @returns A promise that resolves to the default `Language` object.
   */
  @Cacheable(DEFAULT_LANGUAGE_CACHE_KEY)
  async getDefaultLanguage() {
    return await this.findOne({ isDefault: true });
  }

  /**
   * Retrieves the language by code.
   *
   * @returns A promise that resolves to the `Language` object.
   */
  @Cacheable(DEFAULT_LANGUAGE_CACHE_KEY)
  async getLanguageByCode(code: string) {
    return await this.findOne({ code });
  }
}
