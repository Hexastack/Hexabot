/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { WorkflowRunStatus } from "@hexabot-ai/agentic";

export enum EWorkflowRunStatus {
  IDLE = "idle",
  RUNNING = "running",
  SUSPENDED = "suspended",
  FINISHED = "finished",
  FAILED = "failed",
}

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
