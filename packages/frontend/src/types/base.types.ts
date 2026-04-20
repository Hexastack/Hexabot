/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import { Path, PathValue } from "react-hook-form";

import { EntityType, Format, TPopulateTypeFromFormat } from "@/services/types";

import {
  IAttachment,
  IAttachmentAttributes,
  IAttachmentFilters,
} from "./attachment.types";
import { IChannel, IChannelAttributes } from "./channel.types";
import { IContentType, IContentTypeAttributes } from "./content-type.types";
import {
  IContent,
  IContentAttributes,
  IContentFilters,
  IContentFull,
} from "./content.types";
import { ICredential, ICredentialAttributes } from "./credential.types";
import { IHelper, IHelperAttributes } from "./helper.types";
import { ILabelGroup, ILabelGroupAttributes } from "./label-group.types";
import { ILabel, ILabelAttributes, ILabelFull } from "./label.types";
import { ILanguage, ILanguageAttributes } from "./language.types";
import {
  IMcpServer,
  IMcpServerAttributes,
  IMcpServerFull,
} from "./mcp-server.types";
import {
  IMemoryDefinition,
  IMemoryDefinitionAttributes,
} from "./memory-definition.types";
import {
  IMenuNode,
  IMenuNodeAttributes,
  IMenuNodeFull,
} from "./menu-tree.types";
import { IMenuItem, IMenuItemAttributes, IMenuItemFull } from "./menu.types";
import {
  IMessage,
  IMessageAttributes,
  IMessageFilters,
  IMessageFull,
} from "./message.types";
import { IModel, IModelAttributes, IModelFull } from "./model.types";
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
  ISubscriberFilters,
  ISubscriberFull,
} from "./subscriber.types";
import {
  IThread,
  IThreadAttributes,
  IThreadFilters,
  IThreadFull,
} from "./thread.types";
import { ITranslation, ITranslationAttributes } from "./translation.types";
import { IUser, IUserAttributes, IUserFull } from "./user.types";
import {
  IWorkflowRun,
  IWorkflowRunAttributes,
  IWorkflowRunFilters,
  IWorkflowRunFull,
} from "./workflow-run.types";
import {
  IWorkflowVersion,
  IWorkflowVersionAttributes,
  IWorkflowVersionFull,
} from "./workfow-version.types";
import {
  IWorkflow,
  IWorkflowAttributes,
  IWorkflowFilters,
  IWorkflowFull,
} from "./workfow.types";

export interface IBaseSchema {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFormat<F = Format> {
  format: F;
}

export const POPULATE_BY_TYPE = {
  [EntityType.WORKFLOW]: ["currentVersion", "publishedVersion"],
  [EntityType.WORKFLOW_VERSION]: ["parentVersion", "createdBy"],
  [EntityType.WORKFLOW_RUN]: [
    "workflow",
    "workflowVersion",
    "triggeredBy",
    "thread",
  ],
  [EntityType.MCP_SERVER]: ["credential"],
  [EntityType.MEMORY_DEFINITION]: [],
  [EntityType.THREAD]: ["subscriber"],
  [EntityType.ROLE]: ["users", "permissions"],
  [EntityType.USER]: ["roles", "avatar"],
  [EntityType.LABEL]: ["users", "group"],
  [EntityType.LABEL_GROUP]: [],
  [EntityType.MODEL]: ["permissions"],
  [EntityType.PERMISSION]: ["model", "role"],
  [EntityType.CREDENTIAL]: [],
  [EntityType.SUBSCRIBER]: ["labels", "assignedTo"],
  [EntityType.CONTENT_TYPE]: [],
  [EntityType.CONTENT]: ["entity"],
  [EntityType.SETTING]: [],
  [EntityType.MESSAGE]: ["sender", "recipient", "sentBy", "thread"],
  [EntityType.MENU]: ["parent"],
  [EntityType.MENUTREE]: [],
  [EntityType.LANGUAGE]: [],
  [EntityType.TRANSLATION]: [],
  [EntityType.ATTACHMENT]: ["createdBy"],
  [EntityType.CHANNEL]: [],
  [EntityType.HELPER]: [],
  [EntityType.NLU_HELPER]: [],
  [EntityType.LLM_HELPER]: [],
  [EntityType.STORAGE_HELPER]: [],
  [EntityType.STATS]: [],
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
  [EntityType.WORKFLOW]: IEntityTypes<
    IWorkflow,
    IWorkflowAttributes,
    IWorkflowFilters,
    IWorkflowFull
  >;
  [EntityType.WORKFLOW_VERSION]: IEntityTypes<
    IWorkflowVersion,
    IWorkflowVersionAttributes,
    never,
    IWorkflowVersionFull
  >;
  [EntityType.WORKFLOW_RUN]: IEntityTypes<
    IWorkflowRun,
    IWorkflowRunAttributes,
    IWorkflowRunFilters,
    IWorkflowRunFull
  >;
  [EntityType.MCP_SERVER]: IEntityTypes<
    IMcpServer,
    IMcpServerAttributes,
    never,
    IMcpServerFull
  >;
  [EntityType.MEMORY_DEFINITION]: IEntityTypes<
    IMemoryDefinition,
    IMemoryDefinitionAttributes
  >;
  [EntityType.THREAD]: IEntityTypes<
    IThread,
    IThreadAttributes,
    IThreadFilters,
    IThreadFull
  >;
  [EntityType.CONTENT]: IEntityTypes<
    IContent,
    IContentAttributes,
    IContentFilters,
    IContentFull
  >;
  [EntityType.CONTENT_TYPE]: IEntityTypes<IContentType, IContentTypeAttributes>;
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
  [EntityType.CREDENTIAL]: IEntityTypes<ICredential, ICredentialAttributes>;
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
    ISubscriberFilters,
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
    IMessageFilters,
    IMessageFull
  >;
  [EntityType.CHANNEL]: IEntityTypes<IChannel, IChannelAttributes>;
  [EntityType.HELPER]: IEntityTypes<IHelper, IHelperAttributes>;
  [EntityType.NLU_HELPER]: IEntityTypes<IHelper, IHelperAttributes>;
  [EntityType.LLM_HELPER]: IEntityTypes<IHelper, IHelperAttributes>;
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

export type SearchFilters<
  TE extends THook["entity"],
  TF extends THook<{ entity: TE }>["full"] = THook<{ entity: TE }>["full"],
  TP extends Populate<TE> = Populate<TE>,
> = TNestedPaths<{
  [K in TP & keyof TF]?: TF[K] extends unknown[]
    ? { id: string }[]
    : { id: string };
}>;

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
  current: TP["format"] extends Format.FULL
    ? TType<TE>["full"]
    : TType<TE>["basic"];
  filters: Partial<TType<TE>["filters"] & SearchFilters<TE>>;
  params: TP;
  entity: TE;
  populate: TPopulateTypeFromFormat<G>;
  attributes: TType<TE>["attributes"];
};

export type TNestedPaths<T> = {
  [K in Path<T>]: PathValue<T, K>;
};

export interface IFindConfigProps<TE extends THook["entity"]> {
  params?: SearchPayload<TE>;
  hasCount?: boolean;
  initialSortState?: GridSortModel;
  initialPaginationState?: GridPaginationModel;
}
