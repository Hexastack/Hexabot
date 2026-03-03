/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  EIndicatorType,
  NodeExecutionState,
  WorkflowExecutionStateMap,
} from "../types/workflow-node.types";

type ResolveNodeExecutionStateParams = {
  executionStates: WorkflowExecutionStateMap;
  nodeId: string;
  stepId?: string;
  indicator?: EIndicatorType;
};

export const resolveNodeExecutionState = ({
  executionStates,
  nodeId,
  stepId,
  indicator,
}: ResolveNodeExecutionStateParams): NodeExecutionState | undefined => {
  const uniqueKeys = [...new Set([nodeId, stepId, indicator])]
    .filter((key): key is string => typeof key === "string" && key.length > 0);
  const timeline = uniqueKeys.flatMap((key) => executionStates[key] ?? []);

  return timeline
    .slice()
    .sort((first, second) => first.t - second.t)
    .at(-1)?.state;
};
