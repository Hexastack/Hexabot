/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectDynamicProviders } from 'nestjs-dynamic-providers';

import { AttachmentModule } from '@/attachment/attachment.module';
import { ChatModule } from '@/chat/chat.module';
import { BlockOrmEntity } from '@/chat/entities/block.entity';
import { CmsModule } from '@/cms/cms.module';
import { NlpModule } from '@/nlp/nlp.module';

import { PluginService } from './plugins.service';

@InjectDynamicProviders(
  // Built-in plugins
  'node_modules/@hexabot/api/dist/extensions/plugins/**/*.plugin.js',
  // Core & under dev plugins
  'dist/extensions/**/*.plugin.js',
  // Community extensions installed via npm
  'dist/.hexabot/contrib/extensions/plugins/**/*.plugin.js',
  // Custom extensions under dev
  'dist/.hexabot/custom/extensions/plugins/**/*.plugin.js',
)
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([BlockOrmEntity]),
    CmsModule,
    AttachmentModule,
    ChatModule,
    HttpModule,
    NlpModule,
  ],
  providers: [PluginService],
  exports: [PluginService],
})
export class PluginsModule {}
