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

import { EntityType, Format } from "@/services/types";

import type { IBaseSchema, IFormat, OmitPopulate } from "./base.types";
import type { ISubscriber } from "./subscriber.types";
import type { IUser } from "./user.types";
import type { IWorkflowVersion } from "./workfow-version.types";
import type { IWorkflow } from "./workfow.types";

export enum EWorkflowRunStatus {
  IDLE = "idle",
  RUNNING = "running",
  SUSPENDED = "suspended",
  FINISHED = "finished",
  FAILED = "failed",
}
export interface IWorkflowRunAttributes {
  workflow: string;
  workflowVersion?: string | null;
  triggeredBy?: string | null;
  status: WorkflowRunStatus;
  input?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
  context?: Record<string, unknown> | null;
  snapshot?: WorkflowSnapshot | null;
  stepLog?: Record<string, StepExecutionRecord> | null;
  suspendedStep?: string | null;
  suspensionReason?: string | null;
  suspensionData?: unknown;
  lastResumeData?: unknown;
  error?: string | null;
  suspendedAt?: Date | null;
  finishedAt?: Date | null;
  failedAt?: Date | null;
  duration?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface IWorkflowRunFilters {
  workflow: { id: string; name: string; type: string };
  workflowVersion?: { id: string; version: number };
  triggeredBy: string;
  status: WorkflowRunStatus;
  suspendedStep: string;
  suspensionReason: string;
  error: string;
}

export interface IWorkflowRunStub
  extends IBaseSchema,
    OmitPopulate<IWorkflowRunAttributes, EntityType.WORKFLOW_RUN> {
  status: WorkflowRunStatus;
  input?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
  context?: Record<string, unknown> | null;
  snapshot?: WorkflowSnapshot | null;
  suspendedStep?: string | null;
  suspensionReason?: string | null;
  suspensionData?: unknown;
  lastResumeData?: unknown;
  error?: string | null;
  suspendedAt?: Date | null;
  finishedAt?: Date | null;
  failedAt?: Date | null;
  duration?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface IWorkflowRun extends IWorkflowRunStub, IFormat<Format.BASIC> {
  workflow: string;
  workflowVersion?: string | null;
  triggeredBy: string | null;
}

export interface IWorkflowRunFull
  extends IWorkflowRunStub,
    IFormat<Format.FULL> {
  workflow: IWorkflow;
  workflowVersion?: IWorkflowVersion | null;
  triggeredBy: ISubscriber | IUser | null;
}
