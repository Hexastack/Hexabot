/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  getNodesBounds,
  getViewportForBounds,
  useNodesInitialized,
  useReactFlow,
  useStore,
  type Node,
  type Viewport,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const EMPTY_WORKFLOW_SYNC_KEY = "__workflow-empty__";

export type WorkflowViewportState = {
  id?: string | null;
  x?: number | string | null;
  y?: number | string | null;
  zoom?: number | string | null;
};

type UseWorkflowViewportProps<TNode extends Node = Node> = {
  workflow?: WorkflowViewportState | null;
  isEmptyWorkflow: boolean;
  graphNodes: TNode[];
};

export const useWorkflowViewport = <TNode extends Node = Node>({
  workflow,
  isEmptyWorkflow,
  graphNodes,
}: UseWorkflowViewportProps<TNode>) => {
  const { setViewport, getViewport } = useReactFlow();
  const workflowWidth = useStore((state) => state.domNode?.clientWidth ?? 0);
  const workflowHeight = useStore((state) => state.domNode?.clientHeight ?? 0);
  const nodesInitialized = useNodesInitialized();
  const [shouldCenterAfterFirstInsert, setShouldCenterAfterFirstInsert] =
    useState(false);
  const viewportInitializedForFlowRef = useRef<string | null>(null);
  const defaultViewport = useMemo(() => {
    const [x = 0, y = 0, zoom = 1] = [
      Number(workflow?.x),
      Number(workflow?.y),
      Number(workflow?.zoom),
    ].map((value) => (Number.isFinite(value) ? value : undefined));

    return { x, y, zoom };
  }, [workflow?.id, workflow?.x, workflow?.y, workflow?.zoom]);
  const emptyViewport = useMemo(
    () => ({
      x: workflowWidth / 2,
      y: workflowHeight / 2,
      zoom: 1,
    }),
    [workflowHeight, workflowWidth],
  );
  const shouldUseComputedEmptyViewport =
    isEmptyWorkflow &&
    defaultViewport.x === 0 &&
    defaultViewport.y === 0 &&
    defaultViewport.zoom === 1;
  const initialViewport = useMemo(
    () => (shouldUseComputedEmptyViewport ? emptyViewport : defaultViewport),
    [defaultViewport, emptyViewport, shouldUseComputedEmptyViewport],
  );
  const viewportSyncKey = workflow?.id ?? EMPTY_WORKFLOW_SYNC_KEY;
  const syncViewportForFlow = useCallback(
    (viewport: Viewport) => {
      setViewport(viewport);
      viewportInitializedForFlowRef.current = viewportSyncKey;
    },
    [setViewport, viewportSyncKey],
  );

  useEffect(() => {
    if (!nodesInitialized) {
      return;
    }

    if (viewportInitializedForFlowRef.current === viewportSyncKey) {
      return;
    }

    syncViewportForFlow(initialViewport);
  }, [
    initialViewport,
    nodesInitialized,
    syncViewportForFlow,
    viewportSyncKey,
  ]);

  useEffect(() => {
    if (
      !shouldCenterAfterFirstInsert ||
      !nodesInitialized ||
      graphNodes.length === 0
    ) {
      return;
    }

    const currentViewport = getViewport();
    const graphBounds = getNodesBounds(graphNodes);
    const centeredViewport = getViewportForBounds(
      graphBounds,
      workflowWidth,
      workflowHeight,
      currentViewport.zoom,
      currentViewport.zoom,
      0,
    );

    syncViewportForFlow(centeredViewport);

    setShouldCenterAfterFirstInsert(false);
  }, [
    getViewport,
    graphNodes,
    nodesInitialized,
    shouldCenterAfterFirstInsert,
    syncViewportForFlow,
    workflowHeight,
    workflowWidth,
  ]);

  const requestCenterAfterFirstInsert = useCallback(() => {
    if (isEmptyWorkflow) {
      setShouldCenterAfterFirstInsert(true);
    }
  }, [isEmptyWorkflow]);
  const clearCenterAfterFirstInsert = useCallback(() => {
    setShouldCenterAfterFirstInsert(false);
  }, []);

  return {
    initialViewport,
    requestCenterAfterFirstInsert,
    clearCenterAfterFirstInsert,
  };
};
