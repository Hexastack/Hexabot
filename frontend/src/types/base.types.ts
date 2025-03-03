/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { GridPaginationModel, GridSortModel } from "@mui/x-data-grid";

import { EntityType, Format } from "@/services/types";

import { IAttachment, IAttachmentAttributes } from "./attachment.types";
import {
  IBlock,
  IBlockAttributes,
  IBlockFull,
  ICustomBlockTemplate,
} from "./block.types";
import { ICategory, ICategoryAttributes } from "./category.types";
import { IChannel, IChannelAttributes } from "./channel.types";
import { IContentType, IContentTypeAttributes } from "./content-type.types";
import { IContent, IContentAttributes, IContentFull } from "./content.types";
import { IContextVar, IContextVarAttributes } from "./context-var.types";
import { IHelper, IHelperAttributes } from "./helper.types";
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
  INlpEntityFull,
} from "./nlp-entity.types";
import {
  INlpSample,
  INlpSampleAttributes,
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
  [EntityType.LABEL]: ["users"],
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
  [EntityType.STORAGE_HELPER]: [],
} as const;

export type Populate<C extends EntityType> =
  (typeof POPULATE_BY_TYPE)[C][number];

export type OmitPopulate<Attrs, C extends EntityType> = Omit<
  Attrs,
  Populate<C>
>;

interface IEntityTypes<TAttr = never, TStub = never, TFull = never> {
  attributes: TAttr;
  basic: TStub;
  full: TFull;
}

export interface IEntityMapTypes {
  [EntityType.BLOCK]: IEntityTypes<IBlockAttributes, IBlock, IBlockFull>;
  [EntityType.CATEGORY]: IEntityTypes<ICategoryAttributes, ICategory>;
  [EntityType.CONTENT]: IEntityTypes<
    IContentAttributes,
    IContent,
    IContentFull
  >;
  [EntityType.CONTENT_TYPE]: IEntityTypes<IContentTypeAttributes, IContentType>;
  [EntityType.CONTEXT_VAR]: IEntityTypes<IContextVarAttributes, IContextVar>;
  [EntityType.CUSTOM_BLOCK]: IEntityTypes<
    ICustomBlockTemplate,
    ICustomBlockTemplate
  >;
  [EntityType.CUSTOM_BLOCK_SETTINGS]: IEntityTypes<
    ISettingAttributes,
    ISetting
  >;
  [EntityType.LABEL]: IEntityTypes<ILabelAttributes, ILabel, ILabelFull>;
  [EntityType.MENU]: IEntityTypes<
    IMenuItemAttributes,
    IMenuItem,
    IMenuItemFull
  >;
  [EntityType.MENUTREE]: IEntityTypes<
    IMenuNodeAttributes,
    IMenuNode,
    IMenuNodeFull
  >;
  [EntityType.MODEL]: IEntityTypes<IModelAttributes, IModel, IModelFull>;
  [EntityType.NLP_ENTITY]: IEntityTypes<
    INlpEntityAttributes,
    INlpEntity,
    INlpEntityFull
  >;
  [EntityType.NLP_SAMPLE]: IEntityTypes<
    INlpSampleAttributes,
    INlpSample,
    INlpSampleFull
  >;
  [EntityType.NLP_VALUE]: IEntityTypes<
    INlpValueAttributes,
    INlpValue,
    INlpValueFull
  >;
  [EntityType.NLP_SAMPLE_ENTITY]: IEntityTypes<
    INlpSampleEntityAttributes,
    INlpSampleEntity,
    INlpSampleEntityFull
  >;
  [EntityType.PERMISSION]: IEntityTypes<
    IPermissionAttributes,
    IPermission,
    IPermissionFull
  >;
  [EntityType.ROLE]: IEntityTypes<IRoleAttributes, IRole, IRoleFull>;
  [EntityType.SETTING]: IEntityTypes<ISettingAttributes, ISetting>;
  [EntityType.SUBSCRIBER]: IEntityTypes<
    ISubscriberAttributes,
    ISubscriber,
    ISubscriberFull
  >;
  [EntityType.LANGUAGE]: IEntityTypes<ILanguageAttributes, ILanguage>;
  [EntityType.TRANSLATION]: IEntityTypes<ITranslationAttributes, ITranslation>;
  [EntityType.USER]: IEntityTypes<IUserAttributes, IUser, IUserFull>;
  [EntityType.ATTACHMENT]: IEntityTypes<IAttachmentAttributes, IAttachment>;
  [EntityType.MESSAGE]: IEntityTypes<
    IMessageAttributes,
    IMessage,
    IMessageFull
  >;
  [EntityType.CHANNEL]: IEntityTypes<IChannelAttributes, IChannel>;
  [EntityType.HELPER]: IEntityTypes<IHelperAttributes, IHelper>;
  [EntityType.NLU_HELPER]: IEntityTypes<IHelperAttributes, IHelper>;
  [EntityType.LLM_HELPER]: IEntityTypes<IHelperAttributes, IHelper>;
  [EntityType.STORAGE_HELPER]: IEntityTypes<IHelperAttributes, IHelper>;
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
  route?: keyof IEntityMapTypes;
}

export interface IFindConfigProps {
  params?: any;
  hasCount?: boolean;
  initialSortState?: GridSortModel;
  initialPaginationState?: GridPaginationModel;
}
