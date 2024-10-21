/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { InjectDynamicProviders } from 'nestjs-dynamic-providers';

import { AttachmentModule } from '@/attachment/attachment.module';
import { ChatModule } from '@/chat/chat.module';
import { CmsModule } from '@/cms/cms.module';
import { NlpModule } from '@/nlp/nlp.module';

import { ChannelController } from './channel.controller';
import { ChannelMiddleware } from './channel.middleware';
import { ChannelService } from './channel.service';
import { WebhookController } from './webhook.controller';

export interface ChannelModuleOptions {
  folder: string;
}

@InjectDynamicProviders('dist/extensions/**/*.channel.js')
@Module({
  controllers: [WebhookController, ChannelController],
  providers: [ChannelService],
  exports: [ChannelService],
  imports: [NlpModule, ChatModule, AttachmentModule, CmsModule, HttpModule],
})
export class ChannelModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ChannelMiddleware)
      .forRoutes({ path: 'webhook/*', method: RequestMethod.ALL });
  }
}
