/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  StepExecutionRecord,
  WorkflowEventMap,
} from "@hexabot-ai/agentic";
import type { WorkflowRun } from "@hexabot-ai/types";

export type WorkflowEvent<
  T extends keyof WorkflowEventMap = keyof WorkflowEventMap,
> = T extends `${string}:${infer Rest}` ? Rest : T;

export type SubscribeWorkflowProps =
  WorkflowEventMap[keyof WorkflowEventMap] & {
    initiatorId?: string;
    stepExecution?: StepExecutionRecord;
    threadId?: string;
    workflowRun?: WorkflowRun;
    workflowEvent: WorkflowEvent;
    workflowId?: string;
    t: number;
  };
