/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

export enum Action {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
}

export enum MethodToAction {
  POST = "create",
  GET = "read",
  PATCH = "update",
  DELETE = "delete",
}

export type TRelation = "role" | "createdBy";

export const relationSchema = z.enum(["role", "createdBy"]);

export type TModel =
  | "contenttype"
  | "content"
  | "nlpentity"
  | "nlpsampleentity"
  | "nlpsample"
  | "nlpvalue"
  | "setting"
  | "attachment"
  | "user"
  | "role"
  | "permission"
  | "label"
  | "labelgroup"
  | "message"
  | "thread"
  | "subscriber"
  | "language"
  | "translation"
  | "stats"
  | "menu"
  | "workflow"
  | "workflowversion"
  | "workflowrun"
  | "memorydefinition"
  | "memoryrecord"
  | "mcpserver"
  | "model"
  | "credential";

export const modelIdentitySchema = z.enum([
  "contenttype",
  "content",
  "nlpentity",
  "nlpsampleentity",
  "nlpsample",
  "nlpvalue",
  "setting",
  "attachment",
  "user",
  "role",
  "permission",
  "label",
  "labelgroup",
  "message",
  "thread",
  "subscriber",
  "language",
  "translation",
  "stats",
  "menu",
  "workflow",
  "workflowversion",
  "workflowrun",
  "memorydefinition",
  "memoryrecord",
  "mcpserver",
  "model",
  "credential",
]);

export type ModelPermissionsPerRole = Record<TModel, Action[]>;

export type PermissionsTree = Record<string, ModelPermissionsPerRole>;

export enum MenuType {
  web_url = "web_url",
  postback = "postback",
  nested = "nested",
}

export const menuTypeSchema = z.nativeEnum(MenuType);

export enum StatsType {
  outgoing = "outgoing",
  new_users = "new_users",
  all_messages = "all_messages",
  incoming = "incoming",
  returning_users = "returning_users",
  retention = "retention",
  echo = "echo",
}

export const statsTypeSchema = z.nativeEnum(StatsType);

export enum WorkflowType {
  conversational = "conversational",
  manual = "manual",
  scheduled = "scheduled",
}

export const workflowTypeSchema = z.nativeEnum(WorkflowType);

export enum WorkflowVersionAction {
  create = "create",
  update = "update",
  restore = "restore",
  import = "import",
}

export const workflowVersionActionSchema = z.nativeEnum(WorkflowVersionAction);

export enum MemoryScope {
  global = "global",
  workflow = "workflow",
  thread = "thread",
  run = "run",
}

export const memoryScopeSchema = z.nativeEnum(MemoryScope);

export enum McpServerTransport {
  http = "http",
  stdio = "stdio",
}

export const mcpServerTransportSchema = z.nativeEnum(McpServerTransport);

export enum DirectionType {
  HORIZONTAL = "horizontal",
  VERTICAL = "vertical",
}

export const directionTypeSchema = z.nativeEnum(DirectionType);
