/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { InjectDynamicProviders } from 'nestjs-dynamic-providers';

import { ChatModule } from '@/chat/chat.module';
import { CmsModule } from '@/cms/cms.module';
import { NlpModule } from '@/nlp/nlp.module';

import { HelperController } from './helper.controller';
import { HelperService } from './helper.service';

@Global()
@InjectDynamicProviders(
  // Core & under dev helpers
  'dist/extensions/**/*.helper.js',
  // Community extensions installed via npm
  'dist/.hexabot/contrib/extensions/helpers/**/*.helper.js',
  // Custom extensions under dev
  'dist/.hexabot/custom/extensions/helpers/**/*.helper.js',
)
@Module({
  imports: [HttpModule, NlpModule, CmsModule, ChatModule],
  controllers: [HelperController],
  providers: [HelperService],
  exports: [HelperService],
})
export class HelperModule {}
