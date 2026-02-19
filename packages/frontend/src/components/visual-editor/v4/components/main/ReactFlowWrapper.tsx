/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useColorScheme } from "@mui/material";
import {
  type Node,
  type NodeMouseHandler,
  type Viewport,
  OnNodesChange,
  ReactFlow,
} from "@xyflow/react";
import { PropsWithChildren, useCallback, useEffect, useRef } from "react";

import "@xyflow/react/dist/style.css";
import { useWorkflow } from "../../hooks/useWorkflow";
import {
  type EdgeLink,
  EDGE_TYPES,
  NODE_TYPES,
} from "../../types/workflow-node.types";

const VIEWPORT_EPSILON = 0.01;
const isSameViewport = (a: Viewport, b: Viewport): boolean =>
  Math.abs(a.x - b.x) <= VIEWPORT_EPSILON &&
  Math.abs(a.y - b.y) <= VIEWPORT_EPSILON &&
  Math.abs(a.zoom - b.zoom) <= VIEWPORT_EPSILON;

export const ReactFlowWrapper = ({
  defaultEdges,
  defaultNodes,
  defaultViewport,
  onViewport,
  onNodeClick,
  children,
}: {
  defaultNodes: Node[];
  defaultViewport: Viewport;
  defaultEdges: EdgeLink[];
  onViewport: ({ zoom, x, y }: Viewport) => void;
  onDeleteNodes?: (ids: string[]) => void;
  onNodeClick?: NodeMouseHandler<Node>;
} & PropsWithChildren) => {
  const { mode } = useColorScheme();
  const lastViewportRef = useRef<Viewport>(defaultViewport);

  useEffect(() => {
    lastViewportRef.current = defaultViewport;
  }, [defaultViewport.x, defaultViewport.y, defaultViewport.zoom]);

  const handleMoveEnd = useCallback(
    (_event: MouseEvent | TouchEvent | null, viewport: Viewport) => {
      if (isSameViewport(lastViewportRef.current, viewport)) {
        return;
      }

      lastViewportRef.current = viewport;
      onViewport(viewport);
    },
    [onViewport],
  );
  const {
    selectedFlowId,
    selectedNodeIds,
    setSelectedNodeIds,
    updateWorkflowURL,
  } = useWorkflow();
  const handleNodesChange: OnNodesChange<Node> = useCallback(
    (changes) => {
      const selectionEvents = changes.filter((c) => c.type === "select");

      if (!selectionEvents.length) return;

      const nextSelection = new Set(selectedNodeIds);

      selectionEvents.forEach(({ id, selected }) => {
        selected ? nextSelection.add(id) : nextSelection.delete(id);
      });

      const newSelectedNodeIds = Array.from(nextSelection);

      if (
        newSelectedNodeIds.length === selectedNodeIds.length &&
        newSelectedNodeIds.every((id, i) => id === selectedNodeIds[i])
      ) {
        return;
      }

      if (selectedFlowId) {
        updateWorkflowURL(selectedFlowId, newSelectedNodeIds);
      }
      setSelectedNodeIds(newSelectedNodeIds);
    },
    [selectedNodeIds, selectedFlowId, updateWorkflowURL, setSelectedNodeIds],
  );

  return (
    <ReactFlow
      defaultEdges={defaultEdges}
      edges={defaultEdges}
      defaultNodes={defaultNodes}
      nodes={defaultNodes}
      defaultViewport={defaultViewport}
      maxZoom={4}
      minZoom={-2}
      nodeTypes={NODE_TYPES}
      edgeTypes={EDGE_TYPES}
      onNodesChange={handleNodesChange}
      onMoveEnd={handleMoveEnd}
      onNodeClick={onNodeClick}
      onlyRenderVisibleElements
      colorMode={mode}
    >
      {children}
    </ReactFlow>
  );
};
