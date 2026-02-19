/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  getNodesBounds,
  useNodesInitialized,
  useReactFlow,
  useStore,
  type Viewport,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { IWorkflow } from "@/types/workfow.types";

import type { WorkflowGraph } from "../types/workflow-node.types";

import { useFocusNode } from "./useFocusNode";
import { useWorkflow } from "./useWorkflow";

const EMPTY_WORKFLOW_SYNC_KEY = "__workflow-empty__";
const toViewportNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
};
const centerViewportOnNodes = ({
  nodes,
  width,
  height,
  zoom,
  fallback,
}: {
  nodes: WorkflowGraph["nodes"];
  width: number;
  height: number;
  zoom: number;
  fallback: Viewport;
}) => {
  if (!nodes.length || width <= 0 || height <= 0) {
    return fallback;
  }

  const bounds = getNodesBounds(nodes);
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  if (!Number.isFinite(centerX) || !Number.isFinite(centerY)) {
    return fallback;
  }

  return {
    x: width / 2 - centerX * zoom,
    y: height / 2 - centerY * zoom,
    zoom,
  };
};

export const useWorkflowViewport = ({
  workflow,
  isEmptyWorkflow,
  graphNodes,
}: {
  workflow?: IWorkflow | null;
  isEmptyWorkflow: boolean;
  graphNodes: WorkflowGraph["nodes"];
}) => {
  const { setViewport, getViewport } = useReactFlow();
  const domNode = useStore((state) => state.domNode);
  const nodesInitialized = useNodesInitialized();
  const { toFocusIds } = useWorkflow();
  const { animateFocus } = useFocusNode();
  const viewportWidth = domNode?.clientWidth || 0;
  const viewportHeight = domNode?.clientHeight || 0;
  const [shouldCenterAfterFirstInsert, setShouldCenterAfterFirstInsert] =
    useState(false);
  const viewportInitializedForFlowRef = useRef<string | null>(null);
  const defaultViewport = useMemo(
    () => ({
      x: toViewportNumber(workflow?.x, 0),
      y: toViewportNumber(workflow?.y, 0),
      zoom: toViewportNumber(workflow?.zoom, 1),
    }),
    [workflow?.id, workflow?.x, workflow?.y, workflow?.zoom],
  );
  const emptyViewport = useMemo(
    () => ({
      x: viewportWidth / 2,
      y: viewportHeight / 2,
      zoom: 1,
    }),
    [viewportHeight, viewportWidth],
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

    if (toFocusIds.length) {
      viewportInitializedForFlowRef.current = viewportSyncKey;
      animateFocus(toFocusIds);

      return;
    }

    if (viewportInitializedForFlowRef.current === viewportSyncKey) {
      return;
    }

    syncViewportForFlow(initialViewport);
  }, [
    animateFocus,
    initialViewport,
    nodesInitialized,
    syncViewportForFlow,
    toFocusIds,
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
    const centeredViewport = centerViewportOnNodes({
      nodes: graphNodes,
      width: viewportWidth,
      height: viewportHeight,
      zoom: currentViewport.zoom,
      fallback: currentViewport,
    });

    syncViewportForFlow(centeredViewport);
    setShouldCenterAfterFirstInsert(false);
  }, [
    getViewport,
    graphNodes,
    nodesInitialized,
    shouldCenterAfterFirstInsert,
    syncViewportForFlow,
    viewportHeight,
    viewportWidth,
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
    animateFocus,
  };
};
