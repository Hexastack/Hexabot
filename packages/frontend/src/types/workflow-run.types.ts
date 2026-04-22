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
import type { WorkflowRun as SharedWorkflowRun } from "@hexabot-ai/types";

export enum EWorkflowRunStatus {
  IDLE = "idle",
  RUNNING = "running",
  SUSPENDED = "suspended",
  FINISHED = "finished",
  FAILED = "failed",
}
export type IWorkflowRunAttributes = Pick<
  SharedWorkflowRun,
  | "workflow"
  | "workflowVersion"
  | "triggeredBy"
  | "status"
  | "input"
  | "output"
  | "context"
  | "snapshot"
  | "stepLog"
  | "suspendedStep"
  | "suspensionReason"
  | "suspensionData"
  | "lastResumeData"
  | "error"
  | "suspendedAt"
  | "finishedAt"
  | "failedAt"
  | "duration"
  | "metadata"
> & {
  thread?: string | null;
  status: WorkflowRunStatus;
  snapshot?: WorkflowSnapshot | null;
  stepLog?: Record<string, StepExecutionRecord> | null;
};

export interface IWorkflowRunFilters {
  workflow: { id: string; name: string; type: string };
  workflowVersion?: { id: string; version: number };
  triggeredBy: string;
  thread: { id: string };
  status: WorkflowRunStatus;
  suspendedStep: string;
  suspensionReason: string;
  error: string;
}
