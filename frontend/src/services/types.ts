/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { UseMutationOptions } from "react-query";

export enum EntityType {
  SUBSCRIBER = "Subscriber",
  LABEL = "Label",
  ROLE = "Role",
  USER = "User",
  PERMISSION = "Permission",
  MODEL = "Model",
  CATEGORY = "Category",
  CONTEXT_VAR = "ContextVar",
  MENUTREE = "Menu/tree",
  CONTENT = "Content",
  CONTENT_TYPE = "ContentType",
  SETTING = "Setting",
  BOTSTATS = "BotStats",
  BLOCK = "Block",
  CUSTOM_BLOCK = "CustomBlock",
  CUSTOM_BLOCK_SETTINGS = "CustomBlockSetting",
  NLP_SAMPLE = "NlpSample",
  NLP_SAMPLE_ENTITY = "NlpSampleEntity",
  NLP_ENTITY = "NlpEntity",
  NLP_VALUE = "NlpValue",
  MESSAGE = "Message",
  MENU = "Menu",
  LANGUAGE = "Language",
  TRANSLATION = "Translation",
  ATTACHMENT = "Attachment",
  CHANNEL = "Channel",
  HELPER = "Helper",
  NLU_HELPER = "NluHelper",
}

export type NormalizedEntities = Record<string, Record<string, any>>;

export enum Format {
  NONE = 0,
  STUB = 1,
  BASIC = 2,
  FULL = 3,
}

export type TypeByFormat<
  F extends Format | undefined,
  TBasic,
  TFull,
> = F extends Format.FULL ? TFull : TBasic;

export type TCount = {
  count: number;
};

export enum RouterType {
  HOME = "/",
  LOGIN = "login",
  RESET = "reset",
  VISUAL_EDITOR = "visual-editor",
  INBOX = "inbox",
}

export const FULL_WIDTH_PATHNAMES: TRouterValues[] = [
  RouterType.VISUAL_EDITOR,
  RouterType.INBOX,
] as const;

export type TRouterValues = `${RouterType}`;

export type TMutationOptions<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
> = UseMutationOptions<TData, TError, TVariables, TContext> & {
  invalidate?: boolean;
};

export type TSetCacheProps<TData> = {
  id: string;
  payload?: Partial<TData>;
  preprocess?: (data: TData) => TData;
  strategy?: "merge" | "overwrite";
};

export type TPopulateTypeFromFormat<T> = T extends { format: Format.FULL }
  ? string[]
  : undefined;

export enum QueryType {
  item = "item",
  collection = "collection",
  count = "count",
  infinite = "infinite",
}

export type TGetQueryKey = {
  id: string;
  entity: EntityType;
  format?: Format;
  queryType?: QueryType;
};

export type Flatten<T> = T extends any[] ? T[number] : T;
