/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { EntityType, Format } from "@/services/types";

import { IBaseSchema, IFormat, OmitPopulate } from "./base.types";
import { ILabel } from "./label.types";
import {
  ContentOptions,
  PayloadType,
  StdOutgoingAttachmentMessage,
  StdOutgoingButtonsMessage,
  StdOutgoingListMessage,
  StdOutgoingQuickRepliesMessage,
  StdOutgoingTextMessage,
  StdPluginMessage,
} from "./message.types";
import { IUser } from "./user.types";

export type Position = {
  x: number;
  y: number;
};

export interface CaptureVar {
  // entity=`-1` to match text message
  // entity=`-2` for postback payload
  // entity is `String` for NLP entity name
  entity: -1 | -2 | string;
  context_var: string | null;
}

export interface BlockFallbackOptions {
  active: boolean;
  message: string[];
  max_attempts: number;
}

export interface BlockOptions {
  typing?: number;
  // In case of carousel/list message
  content?: ContentOptions;
  // Only if the block has next blocks
  fallback?: BlockFallbackOptions;
  assignTo?: string;
}

export type BlockMessage =
  | string[]
  | StdOutgoingTextMessage
  | StdOutgoingQuickRepliesMessage
  | StdOutgoingButtonsMessage
  | StdOutgoingListMessage
  | StdOutgoingAttachmentMessage
  | StdPluginMessage;

export interface PayloadPattern {
  label: string;
  value: string;
  // @todo : rename 'attachment' to 'attachments'
  // @todo: If undefined, that means the payload could be either quick_reply or button
  // We should update soon so that it will be a required attribute
  type?: PayloadType;
}

export type NlpEntityMatchPattern = {
  entity: string;
  match: "entity";
};

export type NlpValueMatchPattern = {
  entity: string;
  match: "value";
  value: string;
};

export type NlpPattern = NlpEntityMatchPattern | NlpValueMatchPattern;

export type Pattern = string | PayloadPattern | NlpPattern[];

export enum PatternType {
  regex = "regex",
  nlp = "nlp",
  menu = "menu",
  content = "content",
  outcome = "outcome",
  payload = "payload",
  text = "text",
}

export enum BlockType {
  TEXT = "text",
  ATTACHMENT = "attachment",
  QUICK_REPLIES = "quickReplies",
  BUTTONS = "buttons",
  LIST = "list",
  PLUGIN = "plugin",
}

export interface IBlockAttributes {
  name: string;
  patterns?: Pattern[];
  outcomes?: string[];
  trigger_labels?: string[];
  trigger_channels?: string[];
  assign_labels?: string[];
  options?: BlockOptions;
  message: BlockMessage;
  nextBlocks?: string[];
  attachedBlock?: string | null;
  category: string;
  starts_conversation?: boolean;
  capture_vars?: CaptureVar[];
  position: Position;
  type: BlockType; // Computed field added by the processStrategy
}

export interface IBlockStub
  extends IBaseSchema,
    OmitPopulate<IBlockAttributes, EntityType.BLOCK> {}

export interface IBlock extends IBlockStub, IFormat<Format.BASIC> {
  trigger_labels?: string[];
  assign_labels?: string[];
  assignTo?: string | null;
  nextBlocks?: string[];
  attachedBlock?: string | null;
  //to be able to read previousBlocks field from cache
  previousBlocks?: string[];
  attachedToBlock?: string | null;
}

export interface IBlockFull extends IBlockStub, IFormat<Format.FULL> {
  nextBlocks: IBlock[];
  trigger_labels?: ILabel[];
  assign_labels?: ILabel[];
  assignTo?: IUser;
  previousBlocks?: IBlock[];
  attachedBlock?: IBlock;
  attachedToBlock?: IBlock;
}

export interface IBlockSearchResult extends IBlock {
  score: number;
}

export interface ICustomBlockTemplateAttributes {
  template: IBlockAttributes;
  effects: string[];
}

// @TODO : templates doe not contain base schema attributes
export interface ICustomBlockTemplate
  extends IBaseSchema,
    OmitPopulate<ICustomBlockTemplateAttributes, EntityType.CUSTOM_BLOCK> {
  namespace: string;
}

export interface ICustomBlockSettingFilters {
  plugin?: string;
}
