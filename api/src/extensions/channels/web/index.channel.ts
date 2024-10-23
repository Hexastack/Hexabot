/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { AttachmentService } from '@/attachment/services/attachment.service';
import { ChannelService } from '@/channel/channel.service';
import { MessageService } from '@/chat/services/message.service';
import { SubscriberService } from '@/chat/services/subscriber.service';
import { MenuService } from '@/cms/services/menu.service';
import { I18nService } from '@/i18n/services/i18n.service';
import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import BaseWebChannelHandler from './base-web-channel';
import { WEB_CHANNEL_NAME } from './settings';

@Injectable()
export default class WebChannelHandler extends BaseWebChannelHandler<
  typeof WEB_CHANNEL_NAME
> {
  constructor(
    settingService: SettingService,
    channelService: ChannelService,
    logger: LoggerService,
    eventEmitter: EventEmitter2,
    i18n: I18nService,
    subscriberService: SubscriberService,
    attachmentService: AttachmentService,
    messageService: MessageService,
    menuService: MenuService,
    websocketGateway: WebsocketGateway,
  ) {
    super(
      WEB_CHANNEL_NAME,
      settingService,
      channelService,
      logger,
      eventEmitter,
      i18n,
      subscriberService,
      attachmentService,
      messageService,
      menuService,
      websocketGateway,
    );
  }

  getPath(): string {
    return __dirname;
  }
}
