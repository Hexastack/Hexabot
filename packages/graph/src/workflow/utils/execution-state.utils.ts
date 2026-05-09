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
const EXECUTION_STATE_PRIORITY: Record<NodeExecutionState, number> = {
  idle: 0,
  running: 1,
  start: 1,
  finish: 2,
  suspended: 3,
  error: 4,
};

export const resolveNodeExecutionState = ({
  executionStates,
  nodeId,
  stepId,
  indicator,
}: ResolveNodeExecutionStateParams): NodeExecutionState | undefined => {
  const keys: string[] = [];
  const addKey = (key: string | undefined) => {
    if (key && !keys.includes(key)) {
      keys.push(key);
    }
  };

  addKey(nodeId);
  addKey(stepId);
  addKey(indicator);

  let latestState:
    | {
        state: NodeExecutionState;
        t: number;
      }
    | undefined;

  keys.forEach((key) => {
    executionStates[key]?.forEach((entry) => {
      if (
        !latestState ||
        entry.t > latestState.t ||
        (entry.t === latestState.t &&
          EXECUTION_STATE_PRIORITY[entry.state] >=
            EXECUTION_STATE_PRIORITY[latestState.state])
      ) {
        latestState = entry;
      }
    });
  });

  return latestState?.state;
};
