/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useColorScheme } from "@mui/material/styles";
import {
  type Node,
  type NodeChange,
  type NodeMouseHandler,
  type OnNodesChange,
  ReactFlow,
  type Viewport,
} from "@xyflow/react";
import type { ResizeControlDirection } from "@xyflow/system";
import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";

import "@xyflow/react/dist/style.css";

import type {
  WorkflowGraphHostContextValue,
  WorkflowGraphTranslate,
} from "../contexts/workflow-graph-host.context";
import { WorkflowGraphHostContext } from "../contexts/workflow-graph-host.context";
import "../styles/index.css";
import {
  EDGE_TYPES,
  type EdgeLink,
  NODE_TYPES,
  type WorkflowAction,
  type WorkflowExecutionStateMap,
} from "../types/workflow-node.types";
import type { FlowStepPath } from "../types/workflow-path.types";

const VIEWPORT_EPSILON = 0.01;
const isSameViewport = (a: Viewport, b: Viewport): boolean =>
  Math.abs(a.x - b.x) <= VIEWPORT_EPSILON &&
  Math.abs(a.y - b.y) <= VIEWPORT_EPSILON &&
  Math.abs(a.zoom - b.zoom) <= VIEWPORT_EPSILON;
const isSameSelection = (left: string[], right: string[]): boolean =>
  left.length === right.length && left.every((id, idx) => id === right[idx]);

export type WorkflowGraphProps = {
  defaultNodes: Node[];
  defaultViewport: Viewport;
  defaultEdges: EdgeLink[];
  onViewport: ({ zoom, x, y }: Viewport) => void;
  onDeleteNodes?: (ids: string[]) => void;
  onNodeClick?: NodeMouseHandler<Node>;
  onSelectedNodeIdsChange?: (nodeIds: string[]) => void;
  translate: WorkflowGraphTranslate;
  direction?: ResizeControlDirection;
  actionsByName: Map<string, WorkflowAction>;
  executionStates: WorkflowExecutionStateMap;
  onRemoveStep: (stepPath: FlowStepPath, nodeId?: string) => void;
} & PropsWithChildren;

export const WorkflowGraphComponent = ({
  defaultEdges,
  defaultNodes,
  defaultViewport,
  onViewport,
  onNodeClick,
  onSelectedNodeIdsChange,
  translate,
  direction,
  actionsByName,
  executionStates,
  onRemoveStep,
  children,
}: WorkflowGraphProps) => {
  const { mode } = useColorScheme();
  const colorMode = mode === "dark" ? "dark" : "light";
  const lastViewportRef = useRef<Viewport>(defaultViewport);
  const selectedNodeIdsRef = useRef<string[]>([]);
  const hostContextValue = useMemo<WorkflowGraphHostContextValue>(
    () => ({
      translate,
      direction,
      actionsByName,
      executionStates,
      onRemoveStep,
    }),
    [translate, direction, actionsByName, executionStates, onRemoveStep],
  );

  useEffect(() => {
    lastViewportRef.current = defaultViewport;
  }, [defaultViewport.x, defaultViewport.y, defaultViewport.zoom]);
  useEffect(() => {
    selectedNodeIdsRef.current = defaultNodes
      .filter((node) => Boolean(node.selected))
      .map((node) => node.id);
  }, [defaultNodes]);

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
  const handleNodesChange: OnNodesChange<Node> = useCallback(
    (changes) => {
      const selectionEvents = changes.filter(
        (
          change,
        ): change is NodeChange<Node> & {
          type: "select";
          id: string;
          selected: boolean;
        } => change.type === "select",
      );

      if (!selectionEvents.length) {
        return;
      }

      const nextSelection = new Set(selectedNodeIdsRef.current);

      selectionEvents.forEach(({ id, selected }) => {
        if (selected) {
          nextSelection.add(id);
        } else {
          nextSelection.delete(id);
        }
      });

      const newSelectedNodeIds = Array.from(nextSelection);

      if (isSameSelection(newSelectedNodeIds, selectedNodeIdsRef.current)) {
        return;
      }

      selectedNodeIdsRef.current = newSelectedNodeIds;
      onSelectedNodeIdsChange?.(newSelectedNodeIds);
    },
    [onSelectedNodeIdsChange],
  );

  return (
    <WorkflowGraphHostContext.Provider value={hostContextValue}>
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
        colorMode={colorMode}
      >
        {children}
      </ReactFlow>
    </WorkflowGraphHostContext.Provider>
  );
};
