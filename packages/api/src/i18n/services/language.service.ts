/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cache } from 'cache-manager';

import { LoggerService } from '@/logger/logger.service';
import {
  DEFAULT_LANGUAGE_CACHE_KEY,
  LANGUAGES_CACHE_KEY,
} from '@/utils/constants/cache';
import { Cacheable } from '@/utils/decorators/cacheable.decorator';
import { BaseOrmService } from '@/utils/generics/base-orm.service';

import { LanguageDtoConfig, LanguageTransformerDto } from '../dto/language.dto';
import { LanguageOrmEntity } from '../entities/language.entity';
import { LanguageRepository } from '../repositories/language.repository';

@Injectable()
export class LanguageService extends BaseOrmService<
  LanguageOrmEntity,
  LanguageTransformerDto,
  LanguageDtoConfig
> {
  constructor(
    repository: LanguageRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly logger: LoggerService,
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
  async getLanguages(): Promise<Record<string, LanguageOrmEntity>> {
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
    const defaultLanguage = await this.findOne({ where: { isDefault: true } });
    if (!defaultLanguage) {
      throw new InternalServerErrorException(
        'Default language not found: getDefaultLanguage()',
      );
    }
    return defaultLanguage;
  }

  /**
   * Retrieves the language by code.
   *
   * @returns A promise that resolves to the `Language` object.
   */
  async getLanguageByCode(code: string) {
    const language = await this.findOne({ where: { code } });

    if (!language) {
      this.logger.warn(`Unable to Language by languageCode ${code}`);
      throw new NotFoundException(
        `Language with languageCode ${code} not found`,
      );
    }

    return language;
  }

  @OnEvent('hook:language:*')
  async handleLanguageMutated(): Promise<void> {
    await this.cacheManager.del(LANGUAGES_CACHE_KEY);
    await this.cacheManager.del(DEFAULT_LANGUAGE_CACHE_KEY);
  }
}
