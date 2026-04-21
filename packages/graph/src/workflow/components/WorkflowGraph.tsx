/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { CompiledStep, WorkflowDefinition } from "@hexabot-ai/agentic";
import {
  Background,
  type Node,
  type NodeMouseHandler,
  ReactFlow,
  ReactFlowProvider,
  type Viewport,
} from "@xyflow/react";
import type { ResizeControlDirection } from "@xyflow/system";
import {
  forwardRef,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import "@xyflow/react/dist/style.css";

import type {
  WorkflowGraphHostContextValue,
  WorkflowGraphTranslate,
} from "../contexts/workflow-graph-host.context";
import { WorkflowGraphHostContext } from "../contexts/workflow-graph-host.context";
import { useFocusNode } from "../hooks/useFocusNode";
import { useInsertMenuBindings } from "../hooks/useInsertMenuBindings";
import { useWorkflowGraphLayout } from "../hooks/useWorkflowGraphLayout";
import { useWorkflowSelectionController } from "../hooks/useWorkflowSelectionController";
import {
  useWorkflowViewport,
  type ViewportState,
} from "../hooks/useWorkflowViewport";
import "../styles/index.css";
import {
  EDGE_TYPES,
  NODE_TYPES,
  type WorkflowAction,
  type WorkflowBindingAddPayload,
  type WorkflowBindingCatalog,
  type WorkflowBindingRemovePayload,
  type WorkflowExecutionStateMap,
} from "../types/workflow-node.types";
import type {
  EdgeInsertType,
  FlowStepPath,
} from "../types/workflow-path.types";
import type { WorkflowSelectionSnapshot } from "../types/workflow-selection.types";
import { isSameViewport } from "../utils/workflow-graph.utils";

import { WorkflowControls } from "./WorkflowControls";
import { WorkflowEmptyState } from "./WorkflowEmptyState";
import { WorkflowInsertContextMenu } from "./WorkflowInsertContextMenu";

export type WorkflowGraphModel = {
  definition?: WorkflowDefinition;
  compiledFlow?: CompiledStep[];
  actionCatalog: ReadonlyMap<string, WorkflowAction>;
  bindingCatalog: WorkflowBindingCatalog;
  executionStates: WorkflowExecutionStateMap;
  layoutDirection?: ResizeControlDirection;
};

export type WorkflowGraphSelection = {
  selectedNodeIds: string[];
  focusNodeIds?: string[];
  onChange?: (selection: WorkflowSelectionSnapshot) => void;
  onFocusComplete?: () => void;
};

export type WorkflowGraphInsertion = {
  onInsertAtPath?: (insertType: EdgeInsertType, path: FlowStepPath) => void;
  onInsertAtRoot?: (insertType: EdgeInsertType) => void;
};

export type WorkflowGraphViewport = {
  value?: ViewportState | null;
  onChange: ({ zoom, x, y }: Viewport) => void;
};

export type WorkflowGraphCallbacks = {
  onNodeClick?: NodeMouseHandler<Node>;
  onRemoveStep: (stepPath: FlowStepPath, nodeId?: string) => void;
  onAddBinding?: (payload: WorkflowBindingAddPayload) => void;
  onRemoveBinding?: (payload: WorkflowBindingRemovePayload) => void;
  onRotate: (nextDirection: "horizontal" | "vertical") => Promise<boolean>;
};

export type WorkflowGraphColorMode = "light" | "dark" | "system";

export type WorkflowGraphProps = PropsWithChildren<{
  t: WorkflowGraphTranslate;
  model: WorkflowGraphModel;
  selection: WorkflowGraphSelection;
  insertion?: WorkflowGraphInsertion;
  viewport: WorkflowGraphViewport;
  callbacks: WorkflowGraphCallbacks;
  colorMode?: WorkflowGraphColorMode;
}>;

export type WorkflowGraphHandle = {
  animateFocus: (nodeIds?: string[]) => Promise<void>;
  requestCenterAfterFirstInsert: () => void;
  clearCenterAfterFirstInsert: () => void;
};

const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";
const resolveSystemColorMode = (): "light" | "dark" => {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return "light";
  }

  return window.matchMedia(SYSTEM_DARK_QUERY).matches ? "dark" : "light";
};
const resolveColorMode = (mode: WorkflowGraphColorMode): "light" | "dark" => {
  if (mode === "system") {
    return resolveSystemColorMode();
  }

  return mode;
};
const WorkflowGraphCanvas = forwardRef<WorkflowGraphHandle, WorkflowGraphProps>(
  (
    {
      t,
      model,
      selection,
      insertion,
      viewport,
      callbacks,
      colorMode = "system",
      children,
    },
    ref,
  ) => {
    const [resolvedColorMode, setResolvedColorMode] = useState<
      "light" | "dark"
    >(() => resolveColorMode(colorMode));
    const lastViewportRef = useRef<Viewport>({ x: 0, y: 0, zoom: 1 });
    const { graphData, isEmptyWorkflow } = useWorkflowGraphLayout({
      compiledFlow: model.compiledFlow,
      defs: model.definition?.defs,
      layoutDirection: model.layoutDirection,
      actionCatalog: model.actionCatalog,
      bindingCatalog: model.bindingCatalog,
    });
    const {
      edges,
      nodes,
      insertMenuAnchorEl,
      isInsertMenuOpen,
      closeInsertMenu,
      insertFromMenu,
    } = useInsertMenuBindings({
      graphData,
      onInsertAtPath: insertion?.onInsertAtPath,
    });
    const { onNodesChange, emitSelection } = useWorkflowSelectionController({
      isEmptyWorkflow,
      nodes,
      selectedNodeIds: selection.selectedNodeIds,
      onChange: selection.onChange,
    });
    const handleFocusedSelectionResolved = useCallback(
      (nodeIds: string[]) => {
        emitSelection(nodeIds);
      },
      [emitSelection],
    );
    const { animateFocus } = useFocusNode({
      focusNodeIds: selection.focusNodeIds,
      selectedNodeIds: selection.selectedNodeIds,
      onFocusNodeIdsResolved: handleFocusedSelectionResolved,
      onFocused: selection.onFocusComplete,
    });
    const {
      initialViewport,
      requestCenterAfterFirstInsert,
      clearCenterAfterFirstInsert,
    } = useWorkflowViewport({
      viewport: viewport.value,
      isEmptyWorkflow,
      graphNodes: nodes,
    });
    const hostContextValue = useMemo<WorkflowGraphHostContextValue>(
      () => ({
        translate: t,
        colorMode: resolvedColorMode,
        direction: model.layoutDirection,
        actionCatalog: model.actionCatalog,
        executionStates: model.executionStates,
        onRemoveStep: callbacks.onRemoveStep,
        onAddBinding: callbacks.onAddBinding,
        onRemoveBinding: callbacks.onRemoveBinding,
      }),
      [
        callbacks.onAddBinding,
        callbacks.onRemoveBinding,
        callbacks.onRemoveStep,
        model.actionCatalog,
        model.executionStates,
        model.layoutDirection,
        resolvedColorMode,
        t,
      ],
    );

    useImperativeHandle(
      ref,
      () => ({
        animateFocus,
        requestCenterAfterFirstInsert,
        clearCenterAfterFirstInsert,
      }),
      [
        animateFocus,
        clearCenterAfterFirstInsert,
        requestCenterAfterFirstInsert,
      ],
    );

    useEffect(() => {
      lastViewportRef.current = initialViewport;
    }, [initialViewport.x, initialViewport.y, initialViewport.zoom]);

    useEffect(() => {
      if (colorMode !== "system") {
        setResolvedColorMode(colorMode);

        return;
      }

      if (
        typeof window === "undefined" ||
        typeof window.matchMedia !== "function"
      ) {
        setResolvedColorMode("light");

        return;
      }

      const media = window.matchMedia(SYSTEM_DARK_QUERY);
      const handleChange = () => {
        setResolvedColorMode(media.matches ? "dark" : "light");
      };

      handleChange();
      media.addEventListener("change", handleChange);

      return () => {
        media.removeEventListener("change", handleChange);
      };
    }, [colorMode]);

    const handleMoveEnd = useCallback(
      (_event: MouseEvent | TouchEvent | null, nextViewport: Viewport) => {
        if (isSameViewport(lastViewportRef.current, nextViewport)) {
          return;
        }

        lastViewportRef.current = nextViewport;
        viewport.onChange(nextViewport);
      },
      [viewport],
    );

    return (
      <WorkflowGraphHostContext.Provider value={hostContextValue}>
        <ReactFlow
          className="workflow-graph"
          edges={edges}
          nodes={nodes}
          defaultViewport={initialViewport}
          maxZoom={4}
          minZoom={-2}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          onNodesChange={onNodesChange}
          onMoveEnd={handleMoveEnd}
          onNodeClick={callbacks.onNodeClick}
          onlyRenderVisibleElements
          colorMode={resolvedColorMode}
        >
          <WorkflowControls
            direction={model.layoutDirection}
            onFitView={() => {
              void animateFocus();
            }}
            onRotate={callbacks.onRotate}
          />
          <Background size={2} />

          {isEmptyWorkflow && insertion?.onInsertAtRoot ? (
            <WorkflowEmptyState onInsert={insertion.onInsertAtRoot} />
          ) : null}
          {children}
          <WorkflowInsertContextMenu
            id="workflow-insert-menu"
            open={isInsertMenuOpen}
            anchorEl={insertMenuAnchorEl}
            onClose={closeInsertMenu}
            onInsert={insertFromMenu}
          />
        </ReactFlow>
      </WorkflowGraphHostContext.Provider>
    );
  },
);

WorkflowGraphCanvas.displayName = "WorkflowGraphCanvas";

export const WorkflowGraph = forwardRef<
  WorkflowGraphHandle,
  WorkflowGraphProps
>((props, ref) => {
  return (
    <ReactFlowProvider>
      <WorkflowGraphCanvas {...props} ref={ref} />
    </ReactFlowProvider>
  );
});

WorkflowGraph.displayName = "WorkflowGraph";
