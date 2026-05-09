/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { WorkflowRun } from "@hexabot-ai/types";
import { useCallback } from "react";

import { useTanstackQueryClient } from "@/hooks/crud/useTanstack";
import { EntityType, QueryType } from "@/services/types";
import type { SubscribeWorkflowProps } from "@/websocket/types/workflow.types";
import { useWorkflowEventSubscription } from "@/websocket/workflow-event-hooks";

import {
  isWorkflowRunLiveEventForDebugger,
  mergeWorkflowRunLiveEvent,
  shouldWorkflowRunLiveEventTouchQuery,
} from "../live-workflow-run.utils";

type UseWorkflowRunLiveUpdatesProps = {
  workflowId?: string;
  initiatorId?: string;
};

export const useWorkflowRunLiveUpdates = ({
  workflowId,
  initiatorId,
}: UseWorkflowRunLiveUpdatesProps) => {
  const queryClient = useTanstackQueryClient();
  const handleWorkflowEvent = useCallback(
    (event: SubscribeWorkflowProps) => {
      if (!isWorkflowRunLiveEventForDebugger(event, workflowId, initiatorId)) {
        return;
      }

      const runId = event.workflowRun?.id ?? event.runId;

      if (!runId) {
        return;
      }

      queryClient.setQueryData(
        [QueryType.item, EntityType.WORKFLOW_RUN, runId],
        (previousRun) =>
          mergeWorkflowRunLiveEvent(
            previousRun as WorkflowRun | undefined,
            event,
          ),
      );

      queryClient.setQueriesData(
        {
          predicate: ({ queryKey }) =>
            shouldWorkflowRunLiveEventTouchQuery(queryKey, event),
        },
        (collection) => {
          if (!Array.isArray(collection)) {
            return collection ? structuredClone(collection) : collection;
          }

          return collection.includes(runId)
            ? [...collection]
            : [runId, ...collection];
        },
      );
    },
    [initiatorId, queryClient, workflowId],
  );

  useWorkflowEventSubscription(handleWorkflowEvent);
};
