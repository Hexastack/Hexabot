/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InjectDynamicProviders } from 'nestjs-dynamic-providers';

import { AttachmentModule } from '@/attachment/attachment.module';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { ChatModule } from '@/chat/chat.module';
import { BlockModel } from '@/chat/schemas/block.schema';
import { CmsModule } from '@/cms/cms.module';
import { ContentTypeModel } from '@/cms/schemas/content-type.schema';
import { ContentModel } from '@/cms/schemas/content.schema';
import { NlpModule } from '@/nlp/nlp.module';

import { PluginService } from './plugins.service';

@InjectDynamicProviders(
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
    MongooseModule.forFeature([
      BlockModel,
      AttachmentModel,
      ContentModel,
      ContentTypeModel,
    ]),
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
