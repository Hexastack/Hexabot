/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  getNodesBounds,
  getViewportForBounds,
  useReactFlow,
  useStore,
  type Node,
  type Viewport,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const EMPTY_WORKFLOW_SYNC_KEY = "__workflow-empty__";

export type ViewportState = {
  id?: string | null;
  x?: number | string | null;
  y?: number | string | null;
  zoom?: number | string | null;
};

type UseWorkflowViewportProps<TNode extends Node = Node> = {
  viewport?: ViewportState | null;
  isEmptyWorkflow: boolean;
  graphNodes: TNode[];
};

export const useWorkflowViewport = <TNode extends Node = Node>({
  viewport,
  isEmptyWorkflow,
  graphNodes,
}: UseWorkflowViewportProps<TNode>) => {
  const { setViewport, getViewport } = useReactFlow();
  const workflowWidth = useStore(
    (state) => state.width ?? state.domNode?.clientWidth ?? 0,
  );
  const workflowHeight = useStore(
    (state) => state.height ?? state.domNode?.clientHeight ?? 0,
  );
  const [shouldCenterAfterFirstInsert, setShouldCenterAfterFirstInsert] =
    useState(false);
  const viewportInitializedForFlowRef = useRef<string | null>(null);
  const nodeIdsSignatureRef = useRef<string | null>(null);
  const nodeIdsSignature = useMemo(
    () =>
      graphNodes
        .map(({ id }) => id)
        .sort()
        .join("|"),
    [graphNodes],
  );
  const { defaultViewport, hasPersistedViewport } = useMemo(() => {
    const parsedX = Number(viewport?.x);
    const parsedY = Number(viewport?.y);
    const parsedZoom = Number(viewport?.zoom);
    const hasViewport =
      Number.isFinite(parsedX) &&
      Number.isFinite(parsedY) &&
      Number.isFinite(parsedZoom);

    return {
      defaultViewport: {
        x: Number.isFinite(parsedX) ? parsedX : 0,
        y: Number.isFinite(parsedY) ? parsedY : 0,
        zoom: Number.isFinite(parsedZoom) ? parsedZoom : 1,
      },
      hasPersistedViewport: hasViewport,
    };
  }, [viewport?.id, viewport?.x, viewport?.y, viewport?.zoom]);
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
    (!hasPersistedViewport ||
      (defaultViewport.x === 0 &&
        defaultViewport.y === 0 &&
        defaultViewport.zoom === 1));
  const initialViewport = useMemo(
    () => (shouldUseComputedEmptyViewport ? emptyViewport : defaultViewport),
    [defaultViewport, emptyViewport, shouldUseComputedEmptyViewport],
  );
  const viewportSyncKey = viewport?.id ?? EMPTY_WORKFLOW_SYNC_KEY;
  const syncViewportForFlow = useCallback(
    (viewport: Viewport) => {
      setViewport(viewport);
      viewportInitializedForFlowRef.current = viewportSyncKey;
    },
    [setViewport, viewportSyncKey],
  );
  const centerGraphAtCurrentZoom = useCallback(() => {
    if (graphNodes.length === 0 || workflowWidth <= 0 || workflowHeight <= 0) {
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
  }, [
    getViewport,
    graphNodes,
    syncViewportForFlow,
    workflowHeight,
    workflowWidth,
  ]);

  useEffect(() => {
    if (workflowWidth <= 0 || workflowHeight <= 0) {
      return;
    }

    if (viewportInitializedForFlowRef.current === viewportSyncKey) {
      return;
    }

    syncViewportForFlow(initialViewport);
  }, [
    initialViewport,
    syncViewportForFlow,
    viewportSyncKey,
    workflowHeight,
    workflowWidth,
  ]);

  useEffect(() => {
    nodeIdsSignatureRef.current = null;
  }, [viewportSyncKey]);

  useEffect(() => {
    if (
      !shouldCenterAfterFirstInsert ||
      graphNodes.length === 0 ||
      workflowWidth <= 0 ||
      workflowHeight <= 0
    ) {
      return;
    }

    centerGraphAtCurrentZoom();
    setShouldCenterAfterFirstInsert(false);
  }, [
    centerGraphAtCurrentZoom,
    shouldCenterAfterFirstInsert,
    workflowHeight,
    workflowWidth,
  ]);

  useEffect(() => {
    if (workflowWidth <= 0 || workflowHeight <= 0) {
      return;
    }

    const previousNodeIdsSignature = nodeIdsSignatureRef.current;

    nodeIdsSignatureRef.current = nodeIdsSignature;

    if (
      !previousNodeIdsSignature ||
      previousNodeIdsSignature === nodeIdsSignature ||
      shouldCenterAfterFirstInsert
    ) {
      return;
    }

    if (graphNodes.length === 0) {
      const currentViewport = getViewport();

      syncViewportForFlow({
        x: workflowWidth / 2,
        y: workflowHeight / 2,
        zoom: currentViewport.zoom,
      });

      return;
    }

    centerGraphAtCurrentZoom();
  }, [
    centerGraphAtCurrentZoom,
    getViewport,
    graphNodes.length,
    nodeIdsSignature,
    shouldCenterAfterFirstInsert,
    syncViewportForFlow,
    workflowHeight,
    workflowWidth,
  ]);

  useEffect(() => {
    if (isEmptyWorkflow) {
      nodeIdsSignatureRef.current = null;
    }
  }, [isEmptyWorkflow]);

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
