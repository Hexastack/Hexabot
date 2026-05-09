/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { type WorkflowExecutionStateMap } from "@hexabot-ai/graph";
import { useCallback, useEffect, useRef, useState } from "react";

import { useWorkflowEventSubscription } from "@/websocket/workflow-event-hooks";

import type {
  NodeExecutionState,
  SubscribeWorkflowProps,
} from "../types/workflow.types";
import {
  type ExecutionStateUpdateAction,
  isWorkflowEventForFlow,
  mapWorkflowEventToExecutionActions,
} from "../utils/workflow-execution-events.utils";

export const useWorkflowExecutionState = (flowId?: string) => {
  const [executionStates, setExecutionStates] =
    useState<WorkflowExecutionStateMap>({});
  const executionTimeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearExecutionTimeouts = useCallback(() => {
    executionTimeoutIdsRef.current.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    executionTimeoutIdsRef.current = [];
  }, []);
  const appendExecutionState = useCallback(
    (key: string, state: NodeExecutionState, t?: number) => {
      setExecutionStates((previousStates) => ({
        ...previousStates,
        [key]: [...(previousStates[key] ?? []), { state, t: t ?? Date.now() }],
      }));
    },
    [],
  );
  const runExecutionAction = useCallback(
    (action: ExecutionStateUpdateAction) => {
      if (action.type === "clear") {
        setExecutionStates({});

        return;
      }

      appendExecutionState(action.key, action.state, action.t);
    },
    [appendExecutionState],
  );
  const scheduleExecutionAction = useCallback(
    (action: ExecutionStateUpdateAction) => {
      if (!action.delayMs) {
        runExecutionAction(action);

        return;
      }

      const timeoutId = setTimeout(() => {
        executionTimeoutIdsRef.current = executionTimeoutIdsRef.current.filter(
          (pendingTimeoutId) => pendingTimeoutId !== timeoutId,
        );
        runExecutionAction(action);
      }, action.delayMs);

      executionTimeoutIdsRef.current.push(timeoutId);
    },
    [runExecutionAction],
  );
  const handleWorkflowExecutionEvent = useCallback(
    (event: SubscribeWorkflowProps) => {
      if (!isWorkflowEventForFlow(event, flowId)) {
        return;
      }

      const actions = mapWorkflowEventToExecutionActions(event);

      actions.forEach(scheduleExecutionAction);
    },
    [flowId, scheduleExecutionAction],
  );

  useWorkflowEventSubscription(handleWorkflowExecutionEvent);

  useEffect(() => {
    clearExecutionTimeouts();
    setExecutionStates({});
  }, [flowId, clearExecutionTimeouts]);

  useEffect(() => {
    return () => {
      clearExecutionTimeouts();
    };
  }, [clearExecutionTimeouts]);

  return executionStates;
};
