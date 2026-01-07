/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowDefinition } from "@hexabot-ai/agentic";

import { EntityType, Format } from "@/services/types";

import { IBaseSchema, IFormat, OmitPopulate } from "./base.types";

export interface IWorkflowAttributes {
  name: string;
  version: string;
  description?: string | null;
  definition: WorkflowDefinition;
  schedule?: string | null;
  type?: string;
  definitionYaml?: string;
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
