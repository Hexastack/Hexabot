/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import { Path, PathValue } from "react-hook-form";

import { EntityType, Format, TPopulateTypeFromFormat } from "@/services/types";

import {
  IAttachment,
  IAttachmentAttributes,
  IAttachmentFilters,
} from "./attachment.types";
import {
  IBlock,
  IBlockAttributes,
  IBlockFull,
  IBlockSearchResult,
  ICustomBlockSettingFilters,
  ICustomBlockTemplate,
} from "./block.types";
import { ICategory, ICategoryAttributes } from "./category.types";
import { IChannel, IChannelAttributes } from "./channel.types";
import { IContentType, IContentTypeAttributes } from "./content-type.types";
import { IContent, IContentAttributes, IContentFull } from "./content.types";
import { IContextVar, IContextVarAttributes } from "./context-var.types";
import { IHelper, IHelperAttributes } from "./helper.types";
import { ILabelGroup, ILabelGroupAttributes } from "./label-group.types";
import { ILabel, ILabelAttributes, ILabelFull } from "./label.types";
import { ILanguage, ILanguageAttributes } from "./language.types";
import {
  IMenuNode,
  IMenuNodeAttributes,
  IMenuNodeFull,
} from "./menu-tree.types";
import { IMenuItem, IMenuItemAttributes, IMenuItemFull } from "./menu.types";
import { IMessage, IMessageAttributes, IMessageFull } from "./message.types";
import { IModel, IModelAttributes, IModelFull } from "./model.types";
import {
  INlpEntity,
  INlpEntityAttributes,
  INlpEntityFilters,
  INlpEntityFull,
} from "./nlp-entity.types";
import {
  INlpSample,
  INlpSampleAttributes,
  INlpSampleFilters,
  INlpSampleFull,
} from "./nlp-sample.types";
import {
  INlpSampleEntity,
  INlpSampleEntityAttributes,
  INlpSampleEntityFull,
} from "./nlp-sample_entity.types";
import {
  INlpValue,
  INlpValueAttributes,
  INlpValueFull,
} from "./nlp-value.types";
import {
  IPermission,
  IPermissionAttributes,
  IPermissionFull,
} from "./permission.types";
import { IRole, IRoleAttributes, IRoleFull } from "./role.types";
import { SearchPayload } from "./search.types";
import { ISetting, ISettingAttributes } from "./setting.types";
import {
  ISubscriber,
  ISubscriberAttributes,
  ISubscriberFull,
} from "./subscriber.types";
import { ITranslation, ITranslationAttributes } from "./translation.types";
import { IUser, IUserAttributes, IUserFull } from "./user.types";

export interface IBaseSchema {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFormat<F = Format> {
  format: F;
}

export const POPULATE_BY_TYPE = {
  [EntityType.CATEGORY]: [],
  [EntityType.CONTEXT_VAR]: [],
  [EntityType.ROLE]: ["users", "permissions"],
  [EntityType.USER]: ["roles", "avatar"],
  [EntityType.LABEL]: ["users", "group"],
  [EntityType.LABEL_GROUP]: [],
  [EntityType.MODEL]: ["permissions"],
  [EntityType.PERMISSION]: ["model", "role"],
  [EntityType.SUBSCRIBER]: ["labels", "assignedTo"],
  [EntityType.CONTENT_TYPE]: [],
  [EntityType.CONTENT]: ["entity"],
  [EntityType.SETTING]: [],
  [EntityType.BOTSTATS]: [],
  [EntityType.BLOCK]: [
    "nextBlocks",
    "previousBlocks",
    "attachedBlock",
    "attachedToBlock",
    "assign_labels",
    "trigger_labels",
    "assignTo",
  ],
  [EntityType.BLOCK_SEARCH]: [],
  [EntityType.NLP_SAMPLE]: ["language", "entities"],
  [EntityType.NLP_SAMPLE_ENTITY]: ["sample", "entity", "value"],
  [EntityType.NLP_ENTITY]: ["values"],
  [EntityType.NLP_VALUE]: ["entity"],
  [EntityType.MESSAGE]: ["sender", "recipient", "sentBy"],
  [EntityType.MENU]: ["parent"],
  [EntityType.MENUTREE]: [],
  [EntityType.LANGUAGE]: [],
  [EntityType.TRANSLATION]: [],
  [EntityType.ATTACHMENT]: ["createdBy"],
  [EntityType.CUSTOM_BLOCK]: [],
  [EntityType.CUSTOM_BLOCK_SETTINGS]: [],
  [EntityType.CHANNEL]: [],
  [EntityType.HELPER]: [],
  [EntityType.NLU_HELPER]: [],
  [EntityType.LLM_HELPER]: [],
  [EntityType.FLOW_ESCAPE_HELPER]: [],
  [EntityType.STORAGE_HELPER]: [],
} as const;

export type Populate<C extends EntityType> =
  (typeof POPULATE_BY_TYPE)[C][number];

export type OmitPopulate<Attrs, C extends EntityType> = Omit<
  Attrs,
  Populate<C>
>;

export type IsNever<T> = [T] extends [never] ? true : false;

interface IEntityTypes<
  TStub = never,
  TAttr = never,
  TFilters = never,
  TFull = never,
> {
  basic: TStub;
  attributes: TAttr;
  filters: IsNever<TFilters> extends true ? TStub : TFilters;
  full: TFull;
}

export interface IEntityMapTypes {
  [EntityType.BLOCK]: IEntityTypes<IBlock, IBlockAttributes, never, IBlockFull>;
  [EntityType.BLOCK_SEARCH]: IEntityTypes<
    IBlockSearchResult,
    never,
    { limit: number; q: string; category?: string },
    IBlockSearchResult
  >;
  [EntityType.CATEGORY]: IEntityTypes<ICategory, ICategoryAttributes>;
  [EntityType.CONTENT]: IEntityTypes<
    IContent,
    IContentAttributes,
    never,
    IContentFull
  >;
  [EntityType.CONTENT_TYPE]: IEntityTypes<IContentType, IContentTypeAttributes>;
  [EntityType.CONTEXT_VAR]: IEntityTypes<IContextVar, IContextVarAttributes>;
  [EntityType.CUSTOM_BLOCK]: IEntityTypes<
    ICustomBlockTemplate,
    ICustomBlockTemplate
  >;
  [EntityType.CUSTOM_BLOCK_SETTINGS]: IEntityTypes<
    ISetting,
    never,
    ICustomBlockSettingFilters
  >;
  [EntityType.LABEL]: IEntityTypes<ILabel, ILabelAttributes, never, ILabelFull>;
  [EntityType.LABEL_GROUP]: IEntityTypes<ILabelGroup, ILabelGroupAttributes>;
  [EntityType.MENU]: IEntityTypes<
    IMenuItem,
    IMenuItemAttributes,
    never,
    IMenuItemFull
  >;
  [EntityType.MENUTREE]: IEntityTypes<
    IMenuNode,
    IMenuNodeAttributes,
    never,
    IMenuNodeFull
  >;
  [EntityType.MODEL]: IEntityTypes<IModel, IModelAttributes, never, IModelFull>;
  [EntityType.NLP_ENTITY]: IEntityTypes<
    INlpEntity,
    INlpEntityAttributes,
    INlpEntityFilters,
    INlpEntityFull
  >;
  [EntityType.NLP_SAMPLE]: IEntityTypes<
    INlpSample,
    INlpSampleAttributes,
    INlpSampleFilters,
    INlpSampleFull
  >;
  [EntityType.NLP_VALUE]: IEntityTypes<
    INlpValue,
    INlpValueAttributes,
    never,
    INlpValueFull
  >;
  [EntityType.NLP_SAMPLE_ENTITY]: IEntityTypes<
    INlpSampleEntity,
    INlpSampleEntityAttributes,
    never,
    INlpSampleEntityFull
  >;
  [EntityType.PERMISSION]: IEntityTypes<
    IPermission,
    IPermissionAttributes,
    never,
    IPermissionFull
  >;
  [EntityType.ROLE]: IEntityTypes<IRole, IRoleAttributes, never, IRoleFull>;
  [EntityType.SETTING]: IEntityTypes<ISetting, ISettingAttributes>;
  [EntityType.SUBSCRIBER]: IEntityTypes<
    ISubscriber,
    ISubscriberAttributes,
    never,
    ISubscriberFull
  >;
  [EntityType.LANGUAGE]: IEntityTypes<ILanguage, ILanguageAttributes>;
  [EntityType.TRANSLATION]: IEntityTypes<ITranslation, ITranslationAttributes>;
  [EntityType.USER]: IEntityTypes<IUser, IUserAttributes, never, IUserFull>;
  [EntityType.ATTACHMENT]: IEntityTypes<
    IAttachment,
    IAttachmentAttributes,
    IAttachmentFilters
  >;
  [EntityType.MESSAGE]: IEntityTypes<
    IMessage,
    IMessageAttributes,
    never,
    IMessageFull
  >;
  [EntityType.CHANNEL]: IEntityTypes<IChannel, IChannelAttributes>;
  [EntityType.HELPER]: IEntityTypes<IHelper, IHelperAttributes>;
  [EntityType.NLU_HELPER]: IEntityTypes<IHelper, IHelperAttributes>;
  [EntityType.LLM_HELPER]: IEntityTypes<IHelper, IHelperAttributes>;
  [EntityType.FLOW_ESCAPE_HELPER]: IEntityTypes<IHelper, IHelperAttributes>;
  [EntityType.STORAGE_HELPER]: IEntityTypes<IHelper, IHelperAttributes>;
}

export type TType<TParam extends keyof IEntityMapTypes> =
  IEntityMapTypes[TParam];

export type TAllowedFormat<T extends keyof IEntityMapTypes> = {
  format?: (typeof POPULATE_BY_TYPE)[T] extends ReadonlyArray<[]>
    ? Format.BASIC
    : Format;
};

export interface IDynamicProps {
  entity: keyof IEntityMapTypes;
  format?: Format;
}

type AllNever<T> = {
  [K in keyof T]: never;
};

export type THook<
  G extends IDynamicProps = IDynamicProps,
  TE extends keyof IEntityMapTypes = G["entity"],
  TP extends IDynamicProps = IDynamicProps &
    G &
    AllNever<Omit<G, keyof IDynamicProps>> &
    TAllowedFormat<TE>,
> = {
  full: TType<TE>["full"];
  basic: TType<TE>["basic"];
  filters: TType<TE>["filters"];
  params: TP;
  entity: TE;
  populate: TPopulateTypeFromFormat<G>;
  attributes: TType<TE>["attributes"];
};

export type TNestedPaths<T> = {
  [K in Path<T>]: PathValue<T, K>;
};

export interface IFindConfigProps<T = unknown> {
  params?: SearchPayload<T>;
  hasCount?: boolean;
  initialSortState?: GridSortModel;
  initialPaginationState?: GridPaginationModel;
}
