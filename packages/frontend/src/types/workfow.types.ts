/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { WorkflowDefinition } from "@hexabot-ai/agentic";
import type { ResizeControlDirection } from "@xyflow/system";

import { EntityType, Format } from "@/services/types";

import type { IBaseSchema, IFormat, OmitPopulate } from "./base.types";

export interface IWorkflowAttributes {
  name: string;
  version: string;
  description?: string | null;
  definition: WorkflowDefinition;
  schedule?: string | null;
  type?: string;
  definitionYaml?: string;
  zoom?: number;
  // offset?: [number, number];
  x?: number;
  y?: number;
  direction?: ResizeControlDirection;
  memoryDefinitions: string[];
}

export interface IWorkflowFilters {
  name: string;
  version: string;
  description: string;
}

export interface IWorkflowStub
  extends IBaseSchema,
    OmitPopulate<IWorkflowAttributes, EntityType.WORKFLOW> {
  name: string;

  version: string;

  description?: string | null;

  definition: WorkflowDefinition;
}

export interface IWorkflow extends IWorkflowStub, IFormat<Format.BASIC> {}

export interface IWorkflowFull extends IWorkflowStub, IFormat<Format.FULL> {}
