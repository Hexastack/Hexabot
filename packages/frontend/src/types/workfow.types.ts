/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { WorkflowDefinition } from "@hexabot-ai/agentic";
import type { ResizeControlDirection } from "@xyflow/system";

import { EntityType, Format } from "@/services/types";

import type { IBaseSchema, IFormat, OmitPopulate } from "./base.types";
import { IMemoryDefinition } from "./memory-definition.types";
import { IWorkflowVersion } from "./workfow-version.types";

export enum WorkflowType {
  conversational = "conversational",
  manual = "manual",
  scheduled = "scheduled",
}

export interface IWorkflowAttributes {
  name: string;
  description?: string | null;
  builtin?: boolean;
  schedule?: string | null;
  type: WorkflowType;
  zoom?: number;
  x?: number;
  y?: number;
  direction?: ResizeControlDirection;
}

export interface IWorkflowSubmitAttributes extends IWorkflowAttributes {
  definitionYml?: string;
  memoryDefinitions: string[];
}

export interface IWorkflowFilters {
  name: string;
  version: string;
  description: string;
}

export interface IWorkflowStub
  extends IBaseSchema,
    OmitPopulate<IWorkflowAttributes, EntityType.WORKFLOW> {}

export interface IWorkflow extends IWorkflowStub, IFormat<Format.BASIC> {
  currentVersion: string | null;
  publishedVersion: string | null;
  memoryDefinitions: string[];
}

export interface IWorkflowFull extends IWorkflowStub, IFormat<Format.FULL> {
  currentVersion: IWorkflowVersion | null;
  publishedVersion: IWorkflowVersion | null;
  definitionYml: string;
  definition: WorkflowDefinition;
  memoryDefinitions: IMemoryDefinition[];
}
