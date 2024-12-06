/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Subscriber } from '@/chat/schemas/subscriber.schema';
import { ChannelData } from '@/chat/schemas/types/channel';
import { SettingCreateDto } from '@/setting/dto/setting.dto';
import { HyphenToUnderscore } from '@/utils/types/extension';

import ChannelHandler from './lib/Handler';

export type ChannelName = `${string}-channel`;

export type ChannelSetting<N extends string = string> = Omit<
  SettingCreateDto,
  'group' | 'weight'
> & {
  group: HyphenToUnderscore<N>;
};

export type ExtendedChannelData<C extends ChannelHandler, D> = ChannelData & {
  [key in C extends ChannelHandler<infer N> ? N : never]: D;
};

export type ExtendedSubscriber<C extends ChannelHandler, D> =
  | Subscriber
  | (Subscriber & {
      channelData: ExtendedChannelData<C, D>;
    });
