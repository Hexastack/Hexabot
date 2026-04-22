/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  StepExecutionRecord,
  WorkflowRunStatus,
  WorkflowSnapshot,
} from "@hexabot-ai/agentic";
import type {
  AttachmentCreatedByRef,
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
import type { ResizeControlDirection } from "@xyflow/system";
import type { JSONSchema7 as JsonSchema } from "json-schema";
import { Path, PathValue } from "react-hook-form";

import type { SchemaNodeForm } from "@/app-components/inputs/JsonSchemaObjectBuilder";
import { EntityType, Format, TPopulateTypeFromFormat } from "@/services/types";

import { IAttachmentFilters } from "./attachment.types";
import { IChannel } from "./channel.types";
import { IContentFilters } from "./content.types";
import { IHelper } from "./helper.types";
import { IMenuNode, IMenuNodeFull } from "./menu-tree.types";
import {
  IMessageFilters,
  StdIncomingMessage,
  StdOutgoingMessage,
} from "./message.types";
import { SearchPayload } from "./search.types";
import { ISubscriberFilters } from "./subscriber.types";
import { IThreadFilters } from "./thread.types";
import { ILicense } from "./user.types";
import { IWorkflowRunFilters } from "./workflow-run.types";
import { IWorkflowFilters } from "./workfow.types";

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

type EntityPayload<
  TEntity,
  TRequiredKeys extends keyof TEntity,
  TOptionalKeys extends keyof TEntity = never,
  TExtra extends object = Record<never, never>,
> = Pick<TEntity, TRequiredKeys> &
  Partial<Pick<TEntity, TOptionalKeys>> &
  TExtra;

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
    EntityPayload<
      Workflow,
      "name" | "description" | "schedule" | "type",
      "builtin" | "zoom" | "x" | "y",
      {
        direction?: ResizeControlDirection;
        inputSchema?: JsonSchema;
      }
    >,
    IWorkflowFilters,
    WorkflowFull
  >;
  [EntityType.WORKFLOW_VERSION]: IEntityTypes<
    WorkflowVersion,
    EntityPayload<
      WorkflowVersion,
      "definitionYml",
      "version" | "checksum" | "message" | "parentVersion" | "action"
    >,
    never,
    WorkflowVersionFull
  >;
  [EntityType.WORKFLOW_RUN]: IEntityTypes<
    WorkflowRun,
    EntityPayload<
      WorkflowRun,
      | "workflow"
      | "workflowVersion"
      | "triggeredBy"
      | "input"
      | "output"
      | "context"
      | "suspendedStep"
      | "suspensionReason"
      | "suspensionData"
      | "lastResumeData"
      | "error"
      | "suspendedAt"
      | "finishedAt"
      | "failedAt"
      | "duration"
      | "metadata",
      never,
      {
        thread?: string | null;
        status: WorkflowRunStatus;
        snapshot?: WorkflowSnapshot | null;
        stepLog?: Record<string, StepExecutionRecord> | null;
      }
    >,
    IWorkflowRunFilters,
    WorkflowRunFull
  >;
  [EntityType.MCP_SERVER]: IEntityTypes<
    McpServer,
    EntityPayload<
      McpServer,
      | "name"
      | "enabled"
      | "transport"
      | "url"
      | "command"
      | "args"
      | "cwd"
      | "credential"
    >,
    never,
    McpServerFull
  >;
  [EntityType.MEMORY_DEFINITION]: IEntityTypes<
    MemoryDefinition,
    EntityPayload<
      MemoryDefinition,
      "name" | "slug" | "scope" | "schema" | "ttlSeconds"
    >
  >;
  [EntityType.THREAD]: IEntityTypes<
    Thread,
    EntityPayload<
      Thread,
      | "subscriber"
      | "status"
      | "lastMessageAt"
      | "closedAt"
      | "closeReason"
      | "title"
    >,
    IThreadFilters,
    ThreadFull
  >;
  [EntityType.CONTENT]: IEntityTypes<
    Content,
    EntityPayload<Content, "contentType" | "title" | "status" | "properties">,
    IContentFilters,
    ContentFull
  >;
  [EntityType.CONTENT_TYPE]: IEntityTypes<
    ContentType,
    EntityPayload<
      ContentType,
      "name",
      never,
      {
        schema: SchemaNodeForm;
      }
    >
  >;
  [EntityType.LABEL]: IEntityTypes<
    Label,
    EntityPayload<
      Label,
      "title" | "name" | "description" | "builtin" | "group"
    >,
    never,
    LabelFull
  >;
  [EntityType.LABEL_GROUP]: IEntityTypes<
    LabelGroup,
    EntityPayload<LabelGroup, "name">
  >;
  [EntityType.MENU]: IEntityTypes<
    Menu,
    EntityPayload<Menu, "type" | "title" | "url" | "payload" | "parent">,
    never,
    MenuFull
  >;
  [EntityType.MENUTREE]: IEntityTypes<
    IMenuNode,
    EntityPayload<IMenuNode, "type" | "title" | "url" | "payload" | "parent">,
    never,
    IMenuNodeFull
  >;
  [EntityType.MODEL]: IEntityTypes<
    Model,
    EntityPayload<Model, "name" | "identity" | "attributes" | "relation">,
    never,
    ModelFull
  >;
  [EntityType.CREDENTIAL]: IEntityTypes<
    Credential,
    EntityPayload<
      Credential,
      "name" | "owner",
      never,
      {
        value: string;
      }
    >
  >;
  [EntityType.PERMISSION]: IEntityTypes<
    Permission,
    EntityPayload<Permission, "action" | "model" | "role" | "relation">,
    never,
    PermissionFull
  >;
  [EntityType.ROLE]: IEntityTypes<
    Role,
    EntityPayload<Role, "name">,
    never,
    RoleFull
  >;
  [EntityType.SETTING]: IEntityTypes<
    Setting,
    EntityPayload<
      Setting,
      "group" | "label",
      "subgroup",
      {
        value:
          | string
          | number
          | boolean
          | string[]
          | Record<string, unknown>
          | null;
      }
    >
  >;
  [EntityType.SUBSCRIBER]: IEntityTypes<
    Subscriber,
    {
      firstName: Subscriber["firstName"];
      lastName: Subscriber["lastName"];
      locale: Subscriber["locale"];
      gender: Subscriber["gender"];
      labels: string[];
      assignedTo?: string | null;
      assignedAt?: Subscriber["assignedAt"];
      lastvisit?: Subscriber["lastvisit"];
      retainedFrom?: Subscriber["retainedFrom"];
      channel: Subscriber["channel"];
      timezone?: Subscriber["timezone"];
      language: Subscriber["language"];
      country?: Subscriber["country"];
      foreignId?: Subscriber["foreignId"];
    },
    ISubscriberFilters,
    SubscriberFull
  >;
  [EntityType.LANGUAGE]: IEntityTypes<
    Language,
    EntityPayload<Language, "title" | "code" | "isDefault" | "isRTL">
  >;
  [EntityType.TRANSLATION]: IEntityTypes<
    Translation,
    EntityPayload<Translation, "str" | "translations">
  >;
  [EntityType.USER]: IEntityTypes<
    User,
    EntityPayload<
      User,
      | "firstName"
      | "lastName"
      | "email"
      | "state"
      | "roles"
      | "avatar"
      | "language",
      never,
      {
        password?: string;
        license?: ILicense;
      }
    >,
    never,
    UserFull
  >;
  [EntityType.ATTACHMENT]: IEntityTypes<
    Attachment,
    EntityPayload<
      Attachment,
      | "name"
      | "type"
      | "size"
      | "location"
      | "url"
      | "channel"
      | "resourceRef"
      | "access"
      | "createdBy",
      never,
      {
        createdByRef?: AttachmentCreatedByRef;
      }
    >,
    IAttachmentFilters
  >;
  [EntityType.MESSAGE]: IEntityTypes<
    Message,
    {
      mid?: string;
      inReplyTo?: string;
      thread: string;
      sender?: string;
      recipient?: string;
      sentBy?: string;
      message: StdOutgoingMessage | StdIncomingMessage;
      read?: boolean;
      delivery?: boolean;
      handover?: boolean;
    },
    IMessageFilters,
    MessageFull
  >;
  [EntityType.CHANNEL]: IEntityTypes<IChannel, EntityPayload<IChannel, "name">>;
  [EntityType.HELPER]: IEntityTypes<IHelper, EntityPayload<IHelper, "name">>;
  [EntityType.NLU_HELPER]: IEntityTypes<
    IHelper,
    EntityPayload<IHelper, "name">
  >;
  [EntityType.LLM_HELPER]: IEntityTypes<
    IHelper,
    EntityPayload<IHelper, "name">
  >;
  [EntityType.STORAGE_HELPER]: IEntityTypes<
    IHelper,
    EntityPayload<IHelper, "name">
  >;
}

export type TType<TParam extends keyof IEntityMapTypes> =
  IEntityMapTypes[TParam];

export type EntityAttributes<TE extends keyof IEntityMapTypes> =
  TType<TE>["attributes"];

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
