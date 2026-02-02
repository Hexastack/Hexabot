/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  type Node,
  type Viewport,
  Background,
  Controls,
  OnNodesChange,
  ReactFlow,
  useOnViewportChange,
} from "@xyflow/react";
import { PropsWithChildren, useCallback } from "react";

import "@xyflow/react/dist/style.css";
import { useFocusNode } from "../../hooks/useFocusNode";
import { useWorkflow } from "../../hooks/useWorkflow";
import {
  type EdgeLink,
  EDGE_TYPES,
  NODE_TYPES,
} from "../../types/workflow-node.types";

export const ReactFlowWrapper = ({
  defaultEdges,
  defaultNodes,
  defaultViewport,
  onViewport,
  children,
}: {
  defaultNodes: Node[];
  defaultViewport: Viewport;
  defaultEdges: EdgeLink[];
  onViewport: ({ zoom, x, y }: Viewport) => void;
  onDeleteNodes?: (ids: string[]) => void;
  onNodeDoubleClick?: (selectedNodeId: string) => void;
} & PropsWithChildren) => {
  useOnViewportChange({
    onEnd: ({ x, y, zoom }) => {
      if (
        defaultViewport.x === x &&
        defaultViewport.y === y &&
        defaultViewport.zoom === zoom
      ) {
        return;
      }
      onViewport({ x, y, zoom });
    },
  });
  const {
    selectedFlowId,
    selectedNodeIds,
    setSelectedNodeIds,
    updateWorkflowURL,
  } = useWorkflow();
  const { animateFocus } = useFocusNode();
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
      onlyRenderVisibleElements
    >
      <Controls
        className="rf-controls-v4"
        onFitView={animateFocus}
        fitViewOptions={{ duration: 200 }}
      />
      <Background size={2} />
      {children}
    </ReactFlow>
  );
};
