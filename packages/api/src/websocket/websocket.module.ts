/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Global, Module } from '@nestjs/common';

import { UserModule } from '@/user/user.module';

import { SocketEventDispatcherService } from './services/socket-event-dispatcher.service';
import { WebsocketGateway } from './websocket.gateway';

@Global()
@Module({
  imports: [UserModule],
  providers: [WebsocketGateway, SocketEventDispatcherService],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
