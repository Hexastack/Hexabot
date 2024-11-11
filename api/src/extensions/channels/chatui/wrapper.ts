/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ChannelName } from '@/channel/types';
import BaseWebChannelHandler from '@/extensions/channels/web/base-web-channel';
import { Web } from '@/extensions/channels/web/types';
import WebEventWrapper from '@/extensions/channels/web/wrapper';

export default class ChaUiWebEventWrapper<
  T extends
    BaseWebChannelHandler<ChannelName> = BaseWebChannelHandler<ChannelName>,
> extends WebEventWrapper {
  /**
   * Constructor : channel's event wrapper
   *
   * @param handler - The channel's handler
   * @param event - The message event received
   * @param channelData - Channel's specific extra data {isSocket, ipAddress}
   */
  constructor(handler: T, event: Web.Event, channelData: any) {
    super(handler, event, channelData);
  }
}
