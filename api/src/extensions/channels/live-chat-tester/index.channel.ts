/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
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
import { NlpService } from '@/nlp/services/nlp.service';
import { SettingCreateDto } from '@/setting/dto/setting.dto';
import { SettingService } from '@/setting/services/setting.service';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import {
  DEFAULT_LIVE_CHAT_TEST_SETTINGS,
  LIVE_CHAT_TEST_CHANNEL_NAME,
} from './settings';
import OfflineHandler from '../offline/index.channel';

@Injectable()
export default class LiveChatTesterHandler extends OfflineHandler {
  protected settings: SettingCreateDto[] = DEFAULT_LIVE_CHAT_TEST_SETTINGS;

  constructor(
    settingService: SettingService,
    channelService: ChannelService,
    nlpService: NlpService,
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
      settingService,
      channelService,
      nlpService,
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

  /**
   * Returns the channel's name
   * @returns {String}
   */
  getChannel() {
    return LIVE_CHAT_TEST_CHANNEL_NAME;
  }
}
