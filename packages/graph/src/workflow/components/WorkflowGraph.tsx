/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  compileWorkflow,
  type WorkflowCompileOptions,
  type WorkflowDefinition,
} from "@hexabot-ai/agentic";
import { useColorScheme } from "@mui/material/styles";
import {
  Background,
  type Node,
  type NodeChange,
  type NodeMouseHandler,
  type OnNodesChange,
  ReactFlow,
  type Viewport,
} from '@xyflow/react';
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

import { EMPTY_WORKFLOW_GRAPH } from "../constants/workflow.constants";
import type {
  WorkflowGraphHostContextValue,
  WorkflowGraphTranslate,
} from "../contexts/workflow-graph-host.context";
import { WorkflowGraphHostContext } from "../contexts/workflow-graph-host.context";
import { useFocusNode } from "../hooks/useFocusNode";
import {
  useWorkflowViewport,
  type WorkflowViewportState,
} from "../hooks/useWorkflowViewport";
import "../styles/index.css";
import {
  type BranchPlaceholderData,
  EDGE_TYPES,
  ENodeType,
  type MemoryDefinition,
  NODE_TYPES,
  type WorkflowAction,
  type WorkflowExecutionStateMap,
  type WorkflowGraph,
} from "../types/workflow-node.types";
import type {
  EdgeInsertData,
  EdgeInsertType,
  FlowStepPath,
  OnOpenInsertMenu,
} from "../types/workflow-path.types";
import {
  isSameSelection,
  isSameViewport,
} from "../utils/workflow-graph.utils";
import {
  buildNodesAndEdges,
  getWorkflowDefaultConfig,
} from "../utils/workflow-node.utils";

import { WorkflowControls } from "./WorkflowControls";
import { WorkflowEmptyState } from "./WorkflowEmptyState";
import { WorkflowInsertContextMenu } from "./WorkflowInsertContextMenu";

export type WorkflowGraphProps = {
  definition?: WorkflowDefinition;
  memoryDefinitions?: MemoryDefinition[];
  onInsertAtPath?: (insertType: EdgeInsertType, path: FlowStepPath) => void;
  onInsertAtRoot?: (insertType: EdgeInsertType) => void;
  onViewportUpdate: ({ zoom, x, y }: Viewport) => void;
  onDeleteNodes?: (ids: string[]) => void;
  onNodeClick?: NodeMouseHandler<Node>;
  onSelectedNodeIdsChange?: (nodeIds: string[]) => void;
  translate: WorkflowGraphTranslate;
  direction?: ResizeControlDirection;
  actionsByName: Map<string, WorkflowAction>;
  executionStates: WorkflowExecutionStateMap;
  onRemoveStep: (stepPath: FlowStepPath, nodeId?: string) => void;
  onRotate: (nextDirection: 'horizontal' | 'vertical') => Promise<boolean>;
  queryNodeIds?: string;
  selectedNodeIds: string[];
  onSelectNodes: (nodeIds: string[]) => void;
  onFocused?: () => void;
  workflow?: WorkflowViewportState | null;
} & PropsWithChildren;

export type WorkflowGraphRef = {
  animateFocus: (nodeIds?: string[]) => Promise<void>;
  requestCenterAfterFirstInsert: () => void;
  clearCenterAfterFirstInsert: () => void;
};

export const WorkflowGraphComponent = forwardRef<
  WorkflowGraphRef,
  WorkflowGraphProps
>(
  (
    {
      definition,
      memoryDefinitions,
      onInsertAtPath,
      onInsertAtRoot,
      onViewportUpdate,
      onNodeClick,
      onSelectedNodeIdsChange,
      translate,
      direction,
      actionsByName,
      executionStates,
      onRemoveStep,
      onRotate,
      queryNodeIds,
      selectedNodeIds,
      onSelectNodes,
      onFocused,
      workflow,
      children,
    },
    ref,
  ) => {
    const { mode } = useColorScheme();
    const colorMode = mode === 'dark' ? 'dark' : 'light';
    const isEmptyWorkflow = !definition?.flow?.length;
    const compileActionsByName = useMemo(
      () =>
        Array.from(actionsByName.entries()).reduce(
          (acc, [name, action]) => {
            acc[name] =
              action as unknown as WorkflowCompileOptions['actions'][string];

            return acc;
          },
          {} as WorkflowCompileOptions['actions'],
        ),
      [actionsByName],
    );
    const memoryDefinitionsSignature = useMemo(
      () => JSON.stringify(memoryDefinitions ?? []),
      [memoryDefinitions],
    );
    const resolvedMemoryDefinitions = useMemo(
      () => JSON.parse(memoryDefinitionsSignature) as MemoryDefinition[],
      [memoryDefinitionsSignature],
    );
    const lastViewportRef = useRef<Viewport>({ x: 0, y: 0, zoom: 1 });
    const selectedNodeIdsRef = useRef<string[]>([]);
    const [insertMenuAnchorEl, setInsertMenuAnchorEl] =
      useState<HTMLElement | null>(null);
    const [insertMenuPath, setInsertMenuPath] = useState<FlowStepPath | null>(
      null,
    );
    const [graph, setGraph] = useState<WorkflowGraph>(EMPTY_WORKFLOW_GRAPH);
    const { animateFocus } = useFocusNode({
      queryNodeIds,
      selectedNodeIds,
      onSelectNodes,
      onFocused,
    });
    const handleOpenInsertMenu = useCallback<OnOpenInsertMenu>(
      (anchorEl, path) => {
        setInsertMenuAnchorEl(anchorEl);
        setInsertMenuPath(path);
      },
      [],
    );
    const handleCloseInsertMenu = useCallback(() => {
      setInsertMenuAnchorEl(null);
      setInsertMenuPath(null);
    }, []);
    const handleInsertMenuItem = useCallback(
      (insertType: EdgeInsertType) => {
        if (!insertMenuPath || !onInsertAtPath) {
          return;
        }

        onInsertAtPath(insertType, insertMenuPath);
      },
      [insertMenuPath, onInsertAtPath],
    );

    useEffect(() => {
      let isCancelled = false;

      const layoutGraph = async () => {
        if (!definition || isEmptyWorkflow) {
          if (!isCancelled) {
            setGraph(EMPTY_WORKFLOW_GRAPH);
          }

          return;
        }

        try {
          const { flow } = compileWorkflow(definition, {
            actions: compileActionsByName,
          });

          if (!flow.length) {
            if (!isCancelled) {
              setGraph(EMPTY_WORKFLOW_GRAPH);
            }

            return;
          }

          const config = getWorkflowDefaultConfig(direction);
          const layoutedGraph = await buildNodesAndEdges({
            config,
            flow,
            tasks: definition.tasks,
            memoryDefinitions: resolvedMemoryDefinitions,
          });

          if (!isCancelled) {
            setGraph(layoutedGraph ?? EMPTY_WORKFLOW_GRAPH);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to layout workflow graph:', error);
          if (!isCancelled) {
            setGraph(EMPTY_WORKFLOW_GRAPH);
          }
        }
      };

      void layoutGraph();

      return () => {
        isCancelled = true;
      };
    }, [
      compileActionsByName,
      definition,
      direction,
      isEmptyWorkflow,
      resolvedMemoryDefinitions,
    ]);
    const insertMenuHandler = onInsertAtPath ? handleOpenInsertMenu : undefined;
    const edgesWithHandlers = useMemo(() => {
      if (!insertMenuHandler) {
        return graph.edges;
      }

      return graph.edges.map((edge) => {
        const edgeData = edge.data as EdgeInsertData | undefined;

        if (!edgeData?.insertPath) {
          return edge;
        }

        return {
          ...edge,
          data: {
            ...edgeData,
            onOpenInsertMenu: insertMenuHandler,
          },
        };
      });
    }, [graph.edges, insertMenuHandler]);
    const nodesWithHandlers = useMemo(() => {
      if (!insertMenuHandler) {
        return graph.nodes;
      }

      return graph.nodes.map((node) => {
        if (node.type !== ENodeType.BRANCH_PLACEHOLDER) {
          return node;
        }

        const nodeData = node.data as BranchPlaceholderData | undefined;

        if (!nodeData?.insertPath) {
          return node;
        }

        return {
          ...node,
          data: {
            ...nodeData,
            onOpenInsertMenu: insertMenuHandler,
          },
        };
      });
    }, [graph.nodes, insertMenuHandler]);
    const {
      initialViewport,
      requestCenterAfterFirstInsert,
      clearCenterAfterFirstInsert,
    } = useWorkflowViewport({
      workflow,
      isEmptyWorkflow,
      graphNodes: nodesWithHandlers,
    });
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
      selectedNodeIdsRef.current = nodesWithHandlers
        .filter((node) => Boolean(node.selected))
        .map((node) => node.id);
    }, [nodesWithHandlers]);

    const handleMoveEnd = useCallback(
      (_event: MouseEvent | TouchEvent | null, viewport: Viewport) => {
        if (isSameViewport(lastViewportRef.current, viewport)) {
          return;
        }

        lastViewportRef.current = viewport;
        onViewportUpdate(viewport);
      },
      [onViewportUpdate],
    );
    const handleNodesChange: OnNodesChange<Node> = useCallback(
      (changes) => {
        const selectionEvents = changes.filter(
          (
            change,
          ): change is NodeChange<Node> & {
            type: 'select';
            id: string;
            selected: boolean;
          } => change.type === 'select',
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
          defaultEdges={edgesWithHandlers}
          edges={edgesWithHandlers}
          defaultNodes={nodesWithHandlers}
          nodes={nodesWithHandlers}
          defaultViewport={initialViewport}
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
          <WorkflowControls
            direction={direction}
            onFitView={() => {
              void animateFocus();
            }}
            onRotate={onRotate}
          />
          <Background size={2} />

          {isEmptyWorkflow && onInsertAtRoot ? (
            <WorkflowEmptyState onInsert={onInsertAtRoot} />
          ) : null}
          {children}
          <WorkflowInsertContextMenu
            id="workflow-insert-menu"
            open={Boolean(insertMenuAnchorEl && insertMenuPath)}
            anchorEl={insertMenuAnchorEl}
            onClose={handleCloseInsertMenu}
            onInsert={handleInsertMenuItem}
          />
        </ReactFlow>
      </WorkflowGraphHostContext.Provider>
    );
  },
);

WorkflowGraphComponent.displayName = "WorkflowGraphComponent";
