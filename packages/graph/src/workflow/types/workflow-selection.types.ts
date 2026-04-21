/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ENodeType, type EOperatorType } from "./workflow-node.types";
import type { FlowStepPath } from "./workflow-path.types";

export type WorkflowSelectionNode = {
  id: string;
  type: ENodeType;
  stepId?: string;
  stepPath?: FlowStepPath;
  operatorType?: EOperatorType;
  taskName?: string;
  actionName?: string;
};

export type WorkflowSelectionSnapshot = {
  nodeIds: string[];
  nodes: WorkflowSelectionNode[];
};

export const EMPTY_WORKFLOW_SELECTION_SNAPSHOT: WorkflowSelectionSnapshot = {
  nodeIds: [],
  nodes: [],
};
