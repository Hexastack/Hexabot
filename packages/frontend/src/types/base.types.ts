/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  Attachment,
  Content,
  ContentFull,
  ContentType,
  Credential,
  Label,
  LabelFull,
  LabelGroup,
  Language,
  McpServer,
  McpServerFull,
  MemoryDefinition,
  Menu,
  MenuFull,
  Message,
  MessageFull,
  Model,
  ModelFull,
  Permission,
  PermissionFull,
  Role,
  RoleFull,
  Setting,
  Subscriber,
  SubscriberFull,
  Thread,
  ThreadFull,
  Translation,
  User,
  UserFull,
  Workflow,
  WorkflowFull,
  WorkflowRun,
  WorkflowRunFull,
  WorkflowVersion,
  WorkflowVersionFull,
} from "@hexabot-ai/types";
import { GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import { Path, PathValue } from "react-hook-form";

import { EntityType, Format, TPopulateTypeFromFormat } from "@/services/types";

import { IAttachmentAttributes, IAttachmentFilters } from "./attachment.types";
import { IChannel, IChannelAttributes } from "./channel.types";
import { IContentTypeAttributes } from "./content-type.types";
import { IContentAttributes, IContentFilters } from "./content.types";
import { ICredentialAttributes } from "./credential.types";
import { IHelper, IHelperAttributes } from "./helper.types";
import { ILabelGroupAttributes } from "./label-group.types";
import { ILabelAttributes } from "./label.types";
import { ILanguageAttributes } from "./language.types";
import { IMcpServerAttributes } from "./mcp-server.types";
import { IMemoryDefinitionAttributes } from "./memory-definition.types";
import {
  IMenuNode,
  IMenuNodeAttributes,
  IMenuNodeFull,
} from "./menu-tree.types";
import { IMenuItemAttributes } from "./menu.types";
import { IMessageAttributes, IMessageFilters } from "./message.types";
import { IModelAttributes } from "./model.types";
import { IPermissionAttributes } from "./permission.types";
import { IRoleAttributes } from "./role.types";
import { SearchPayload } from "./search.types";
import { ISettingAttributes } from "./setting.types";
import { ISubscriberAttributes, ISubscriberFilters } from "./subscriber.types";
import { IThreadAttributes, IThreadFilters } from "./thread.types";
import { ITranslationAttributes } from "./translation.types";
import { IUserAttributes } from "./user.types";
import {
  IWorkflowRunAttributes,
  IWorkflowRunFilters,
} from "./workflow-run.types";
import { IWorkflowVersionAttributes } from "./workfow-version.types";
import { IWorkflowAttributes, IWorkflowFilters } from "./workfow.types";

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
    Workflow,
    IWorkflowAttributes,
    IWorkflowFilters,
    WorkflowFull
  >;
  [EntityType.WORKFLOW_VERSION]: IEntityTypes<
    WorkflowVersion,
    IWorkflowVersionAttributes,
    never,
    WorkflowVersionFull
  >;
  [EntityType.WORKFLOW_RUN]: IEntityTypes<
    WorkflowRun,
    IWorkflowRunAttributes,
    IWorkflowRunFilters,
    WorkflowRunFull
  >;
  [EntityType.MCP_SERVER]: IEntityTypes<
    McpServer,
    IMcpServerAttributes,
    never,
    McpServerFull
  >;
  [EntityType.MEMORY_DEFINITION]: IEntityTypes<
    MemoryDefinition,
    IMemoryDefinitionAttributes
  >;
  [EntityType.THREAD]: IEntityTypes<
    Thread,
    IThreadAttributes,
    IThreadFilters,
    ThreadFull
  >;
  [EntityType.CONTENT]: IEntityTypes<
    Content,
    IContentAttributes,
    IContentFilters,
    ContentFull
  >;
  [EntityType.CONTENT_TYPE]: IEntityTypes<ContentType, IContentTypeAttributes>;
  [EntityType.LABEL]: IEntityTypes<Label, ILabelAttributes, never, LabelFull>;
  [EntityType.LABEL_GROUP]: IEntityTypes<LabelGroup, ILabelGroupAttributes>;
  [EntityType.MENU]: IEntityTypes<Menu, IMenuItemAttributes, never, MenuFull>;
  [EntityType.MENUTREE]: IEntityTypes<
    IMenuNode,
    IMenuNodeAttributes,
    never,
    IMenuNodeFull
  >;
  [EntityType.MODEL]: IEntityTypes<Model, IModelAttributes, never, ModelFull>;
  [EntityType.CREDENTIAL]: IEntityTypes<Credential, ICredentialAttributes>;
  [EntityType.PERMISSION]: IEntityTypes<
    Permission,
    IPermissionAttributes,
    never,
    PermissionFull
  >;
  [EntityType.ROLE]: IEntityTypes<Role, IRoleAttributes, never, RoleFull>;
  [EntityType.SETTING]: IEntityTypes<Setting, ISettingAttributes>;
  [EntityType.SUBSCRIBER]: IEntityTypes<
    Subscriber,
    ISubscriberAttributes,
    ISubscriberFilters,
    SubscriberFull
  >;
  [EntityType.LANGUAGE]: IEntityTypes<Language, ILanguageAttributes>;
  [EntityType.TRANSLATION]: IEntityTypes<Translation, ITranslationAttributes>;
  [EntityType.USER]: IEntityTypes<User, IUserAttributes, never, UserFull>;
  [EntityType.ATTACHMENT]: IEntityTypes<
    Attachment,
    IAttachmentAttributes,
    IAttachmentFilters
  >;
  [EntityType.MESSAGE]: IEntityTypes<
    Message,
    IMessageAttributes,
    IMessageFilters,
    MessageFull
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
