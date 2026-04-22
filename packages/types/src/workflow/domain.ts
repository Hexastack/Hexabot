/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

export enum WorkflowType {
  conversational = "conversational",
  manual = "manual",
  scheduled = "scheduled",
}

export enum WorkflowVersionAction {
  create = "create",
  update = "update",
  restore = "restore",
  import = "import",
}

export enum MemoryScope {
  global = "global",
  workflow = "workflow",
  thread = "thread",
  run = "run",
}

export enum McpServerTransport {
  http = "http",
  stdio = "stdio",
}

export enum DirectionType {
  HORIZONTAL = "horizontal",
  VERTICAL = "vertical",
}

export const workflowTypeSchema = z.nativeEnum(WorkflowType);

export const workflowVersionActionSchema = z.nativeEnum(WorkflowVersionAction);

export const memoryScopeSchema = z.nativeEnum(MemoryScope);

export const mcpServerTransportSchema = z.nativeEnum(McpServerTransport);

export const directionTypeSchema = z.nativeEnum(DirectionType);
