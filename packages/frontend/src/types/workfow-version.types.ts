/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EntityType, Format } from "@/services/types";

import type { IBaseSchema, IFormat, OmitPopulate } from "./base.types";
import { IUser } from "./user.types";
import { IWorkflow } from "./workfow.types";

export enum WorkflowVersionAction {
  create = 'create',
  update = 'update',
  restore = 'restore',
  import = 'import',
  publish = 'publish',
}

export interface IWorkflowVersionAttributes {
  version?: number;
  definitionYml: string;
  checksum?: string;
  message?: string | null;
  action: WorkflowVersionAction;
}

export interface IWorkflowVersionStub
  extends IBaseSchema,
    OmitPopulate<IWorkflowVersionAttributes, EntityType.WORKFLOW_VERSION> {
  version: number;
  definitionYml: string;
  checksum: string;
  message?: string | null;
  action: WorkflowVersionAction;
}

export interface IWorkflowVersion extends IWorkflowVersionStub, IFormat<Format.BASIC> {
  workflow: string;
  parentVersion?: string | null;
  createdBy: string;
}

export interface IWorkflowVersionFull
  extends IWorkflowVersionStub,
    IFormat<Format.FULL> {
  workflow: IWorkflow;
  parentVersion?: IWorkflowVersion | null;
  createdBy: IUser;
}
