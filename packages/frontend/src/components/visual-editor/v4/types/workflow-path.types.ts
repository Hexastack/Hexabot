/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { FlowStepPath, StepType } from "@hexabot-ai/agentic";

export type { FlowStepPath };

export type EdgeInsertType =
  | StepType.Conditional
  | StepType.Loop
  | StepType.Parallel
  | "step";

export type EdgeInsertData = {
  insertPath?: FlowStepPath;
  onInsert?: (path: FlowStepPath, type: EdgeInsertType) => void;
};
