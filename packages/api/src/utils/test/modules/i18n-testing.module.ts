/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Global, Module } from '@nestjs/common';

import { I18nServiceProvider } from '../providers/i18n-service.provider';

@Global()
@Module({
  providers: [I18nServiceProvider],
  exports: [I18nServiceProvider],
})
export class I18nTestingModule {}
