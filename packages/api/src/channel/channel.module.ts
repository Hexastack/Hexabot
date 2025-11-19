/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { HttpModule } from '@nestjs/axios';
import {
  Global,
  MiddlewareConsumer,
  Module,
  RequestMethod,
} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InjectDynamicProviders } from 'nestjs-dynamic-providers';

import { AttachmentModule } from '@/attachment/attachment.module';
import { ChatModule } from '@/chat/chat.module';
import { CmsModule } from '@/cms/cms.module';

import { ChannelController } from './channel.controller';
import { ChannelMiddleware } from './channel.middleware';
import { ChannelService } from './channel.service';
import { WebhookController } from './webhook.controller';

export interface ChannelModuleOptions {
  folder: string;
}

@Global()
@InjectDynamicProviders(
  // Built-in core channels
  'node_modules/@hexabot-ai/api/dist/extensions/channels/**/*.channel.js',
  // Community extensions installed via npm
  'node_modules/hexabot-channel-*/**/*.channel.js',
  // Custom & under dev channels
  'dist/extensions/channels/**/*.channel.js',
)
@Module({
  imports: [ChatModule, AttachmentModule, CmsModule, HttpModule, JwtModule],
  controllers: [WebhookController, ChannelController],
  providers: [ChannelService],
  exports: [ChannelService],
})
export class ChannelModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ChannelMiddleware)
      .forRoutes({ path: 'webhook/*path', method: RequestMethod.ALL });
  }
}
