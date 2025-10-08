/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { ChannelEvent } from '@/channel/lib/EventWrapper';
import { BlockCreateDto } from '@/chat/dto/block.dto';
import { Block } from '@/chat/schemas/block.schema';
import { Conversation } from '@/chat/schemas/conversation.schema';
import { ExtensionSetting } from '@/setting/schemas/types';

export type PluginName = `${string}-plugin`;

export enum PluginType {
  event = 'event',
  block = 'block',
}

export interface CustomBlocks {}

type BlockAttrs = Partial<BlockCreateDto> & { name: string };

export type PluginSetting = ExtensionSetting;

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
