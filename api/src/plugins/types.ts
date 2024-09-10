/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { BlockCreateDto } from '@/chat/dto/block.dto';
import { Block } from '@/chat/schemas/block.schema';
import { Conversation } from '@/chat/schemas/conversation.schema';
import { Setting } from '@/setting/schemas/setting.schema';

export enum PluginType {
  event = 'event',
  block = 'block',
  storage = 'storage',
}

export interface CustomBlocks {}

type ChannelEvent = any;
type BlockAttrs = Partial<BlockCreateDto> & { name: string };

export type PluginSetting = Omit<Setting, 'createdAt' | 'updatedAt'>;

export type PluginBlockTemplate = Omit<
  BlockAttrs,
  'message' | 'position' | 'builtin' | 'attachedBlock'
>;

export type PluginEffects = {
  onStoreContextData?: (
    convo: Conversation,
    nextBlock: Block,
    event: ChannelEvent,
    captureVars: any,
  ) => void;
};
