/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { HttpModule } from '@nestjs/axios';
import { forwardRef, Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InjectDynamicProviders } from 'nestjs-dynamic-providers';

import { AttachmentModule } from '@/attachment/attachment.module';
import { ChatModule } from '@/chat/chat.module';
import { CmsModule } from '@/cms/cms.module';
import { WorkflowModule } from '@/workflow/workflow.module';

import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';
import { ChannelEventBus } from './lib/channel-event-bus';
import { ChannelAttachmentService } from './services/channel-attachment.service';
import { ChannelDownloadService } from './services/channel-download.service';
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
  imports: [
    ChatModule,
    AttachmentModule,
    CmsModule,
    HttpModule,
    JwtModule,
    forwardRef(() => WorkflowModule),
  ],
  controllers: [WebhookController, ChannelController],
  providers: [
    ChannelEventBus,
    ChannelService,
    ChannelAttachmentService,
    ChannelDownloadService,
  ],
  exports: [ChannelService],
})
export class ChannelModule {}
