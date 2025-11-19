/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  DynamicModule,
  Global,
  Inject,
  InternalServerErrorException,
  Module,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  I18N_OPTIONS,
  I18N_TRANSLATIONS,
  I18nOptions,
  I18nTranslation,
  I18nModule as NativeI18nModule,
} from 'nestjs-i18n';
import { Observable } from 'rxjs';

import { ChatModule } from '@/chat/chat.module';

import { I18nController } from './controllers/i18n.controller';
import { LanguageController } from './controllers/language.controller';
import { TranslationController } from './controllers/translation.controller';
import { LanguageOrmEntity } from './entities/language.entity';
import { TranslationOrmEntity } from './entities/translation.entity';
import { LanguageRepository } from './repositories/language.repository';
import { TranslationRepository } from './repositories/translation.repository';
import { LanguageSeeder } from './seeds/language.seed';
import { TranslationSeeder } from './seeds/translation.seed';
import { I18nService } from './services/i18n.service';
import { LanguageService } from './services/language.service';
import { TranslationService } from './services/translation.service';

@Global()
@Module({})
export class I18nModule extends NativeI18nModule {
  constructor(
    i18n: I18nService,
    @Inject(I18N_TRANSLATIONS)
    translations: Observable<I18nTranslation>,
    @Inject(I18N_OPTIONS) i18nOptions: I18nOptions,
    adapter: HttpAdapterHost,
  ) {
    super(i18n, translations, i18nOptions, adapter);
  }

  static forRoot(options: I18nOptions): DynamicModule {
    const { imports, providers, controllers, exports } = super.forRoot(options);
    if (!providers || !exports) {
      throw new InternalServerErrorException(
        'I18n: Unable to find providers and/or exports forRoot()',
      );
    }

    return {
      module: I18nModule,
      imports: (imports || []).concat([
        TypeOrmModule.forFeature([LanguageOrmEntity, TranslationOrmEntity]),
        ChatModule,
      ]),
      controllers: (controllers || []).concat([
        LanguageController,
        TranslationController,
        I18nController,
      ]),
      providers: providers.concat([
        I18nService,
        LanguageRepository,
        LanguageService,
        LanguageSeeder,
        TranslationRepository,
        TranslationService,
        TranslationSeeder,
      ]),
      exports: exports.concat(I18nService, LanguageService),
    };
  }
}
