/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  addEdge,
  Background,
  Controls,
  Edge,
  EdgeMouseHandler,
  MiniMap,
  Node,
  NodeMouseHandler,
  OnConnect,
  OnNodeDrag,
  OnNodesChange,
  ReactFlow,
  useKeyPress,
  useOnViewportChange,
  useReactFlow,
  Viewport,
} from "@xyflow/react";
import { useCallback, useEffect } from "react";

import "@xyflow/react/dist/style.css";

// import DarkModeControl from "./components/DarkModeControl";

import { useHasPermission } from "@/hooks/useHasPermission";
import { EntityType } from "@/services/types";
import { IBlockAttributes } from "@/types/block.types";
import { PermissionAction } from "@/types/permission.types";

import { useDeleteManyBlocksDialog } from "../../hooks/useDeleteManyBlocksDialog";
import { useEditBlockDialog } from "../../hooks/useEditBlockDialog";
import { useFocusBlock } from "../../hooks/useFocusBlock";
import { useVisualEditor } from "../../hooks/useVisualEditor";
import {
  EdgeLink,
  INodeAttributes,
  LinkType,
  TBlock,
} from "../../types/visual-editor.types";
import {
  getBlockConfigByType,
  updateEdgeButtonStyle,
  updateEdgeSvgStyle,
} from "../../utils/block.utils";
import { EdgeWithButton } from "../edges/EdgeWithButton";
import { NodeBlock } from "../nodes/NodeBlock";

const NODE_TYPES = {
  block: NodeBlock,
};
const EDGE_TYPES = { edgeWithButton: EdgeWithButton };

export const ReactFlowWrapper = ({
  defaultEdges,
  defaultNodes,
  defaultViewport,
  onUpdateNode,
  onViewport,
  onDeleteNodes,
  onNodeDoubleClick,
}: {
  defaultNodes: Node[];
  defaultViewport: Viewport;
  defaultEdges: EdgeLink[];
  onUpdateNode: ({ id, ...rest }: INodeAttributes) => void;
  onViewport: ({ zoom, x, y }: Viewport) => void;
  onDeleteNodes?: (ids: string[]) => void;
  onNodeDoubleClick?: (selectedBlockId: string) => void;
}) => {
  const hasPermission = useHasPermission();
  const { animateFocus } = useFocusBlock();
  const { setEdges, updateEdge, updateNode, getNode } = useReactFlow();
  const {
    setSelectedNodeIds,
    selectedNodeIds,
    getBlockFromCache,
    selectedCategoryId,
    updateCachePreviousBlocks,
    removeBlockIdParam,
    updateVisualEditorURL,
  } = useVisualEditor();
  const deleteKeyPressed = useKeyPress("Delete");
  const { openDeleteManyDialog } = useDeleteManyBlocksDialog();
  const { openEditDialog } = useEditBlockDialog();
  const onConnect: OnConnect = (params) => {
    const { source: sourceNodeId, target: targetNodeId, sourceHandle } = params;
    const sourceNode = getBlockFromCache(sourceNodeId);
    const payload: Partial<IBlockAttributes> =
      sourceHandle === LinkType.NEXT_BLOCKS
        ? {
            nextBlocks: [
              ...(sourceNode?.nextBlocks || []).filter(
                (id) => id !== targetNodeId,
              ),
              targetNodeId,
            ],
          }
        : { attachedBlock: targetNodeId };

    setEdges((eds) => addEdge({ ...params, type: "edgeWithButton" }, eds));

    onUpdateNode({
      id: sourceNodeId,
      ...payload,
    });

    updateCachePreviousBlocks("add", sourceNodeId, targetNodeId);
  };
  const handleNodeDoubleClick: NodeMouseHandler<Node> = useCallback(
    (_, { id }) => {
      if (selectedNodeIds.length === 1) {
        onNodeDoubleClick?.(id) || openEditDialog(id);
      }
    },
    [selectedNodeIds.length, onNodeDoubleClick, openEditDialog],
  );
  const handleNodeDragStart: OnNodeDrag<Node> = useCallback(
    (_, { id }) => {
      if (selectedCategoryId && selectedNodeIds.length === 1) {
        setSelectedNodeIds([id]);
        updateVisualEditorURL(selectedCategoryId, [id]);
      }
    },
    [
      selectedNodeIds,
      selectedCategoryId,
      setSelectedNodeIds,
      updateVisualEditorURL,
    ],
  );
  const handleNodeDragStop: OnNodeDrag<Node> = useCallback(
    async (_e, _node, nodes) => {
      try {
        for (const { id, position, data } of nodes) {
          if (data["starts_conversation"] === true) {
            const hasReadOnlyBlock = getNode(`startPoint-${id}`);

            if (hasReadOnlyBlock) {
              updateNode(`startPoint-${id}`, {
                position: { x: position.x - 250, y: position.y + 50 },
              });
            }
          }

          onUpdateNode({
            id,
            position,
          });
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Unable to update node", e);
      }
    },
    [onUpdateNode],
  );
  const handleNodesChange: OnNodesChange<Node> = useCallback(
    (changes) => {
      const selectionEvents = changes.filter((c) => c.type === "select");

      if (selectionEvents.length) {
        const selected = selectionEvents
          .filter((s) => s.selected)
          .map((s) => s.id);
        const unselected = selectionEvents
          .filter((s) => !s.selected)
          .map((s) => s.id);
        const newSelectedNodeIds = [
          ...selectedNodeIds.filter((s) => !unselected.includes(s)),
          ...selected.filter((s) => !selectedNodeIds.includes(s)),
        ];

        if (selectedCategoryId) {
          updateVisualEditorURL(selectedCategoryId, newSelectedNodeIds);
        }

        setSelectedNodeIds(newSelectedNodeIds);
      }
    },
    [
      selectedNodeIds,
      selectedCategoryId,
      removeBlockIdParam,
      setSelectedNodeIds,
      updateVisualEditorURL,
    ],
  );

  useOnViewportChange({
    onEnd: onViewport,
  });

  useEffect(() => {
    if (
      hasPermission(EntityType.BLOCK, PermissionAction.DELETE) &&
      deleteKeyPressed &&
      selectedNodeIds.length
    ) {
      openDeleteManyDialog(selectedNodeIds);
    }
  }, [
    onDeleteNodes,
    selectedNodeIds,
    deleteKeyPressed,
    openDeleteManyDialog,
    removeBlockIdParam,
    hasPermission,
  ]);

  const handleEdgeMouseEnter: EdgeMouseHandler<Edge> = useCallback(
    (e, { id, style }) => {
      updateEdgeSvgStyle(e.target, "zIndex", "1001");
      updateEdgeButtonStyle(id, "zIndex", "1001");
      updateEdge(id, { style: { ...style, stroke: "#1dc7fc" } });
    },
    [updateEdge],
  );
  const handleEdgeMouseLeave: EdgeMouseHandler<Edge> = useCallback(
    (e, { id, style, sourceHandle }) => {
      updateEdgeSvgStyle(e.target, "zIndex", "0");
      updateEdgeButtonStyle(id, "zIndex", "0");
      updateEdge(id, {
        style: {
          ...style,
          stroke: sourceHandle === LinkType.ATTACHED ? "#019185" : "#555",
        },
      });
    },
    [updateEdge],
  );
  const handleEdgeClick = useCallback(
    (e: React.MouseEvent, { id, source, target, sourceHandle }: Edge) => {
      const isEdgeButton = e.target?.["tagName"] === "BUTTON";

      if (isEdgeButton && source) {
        const block = getBlockFromCache(source);
        const payload: Partial<IBlockAttributes> =
          sourceHandle === LinkType.NEXT_BLOCKS
            ? {
                nextBlocks: block?.nextBlocks?.filter((n) => n !== target),
              }
            : { attachedBlock: null };

        setEdges((edges) => edges.filter((edge) => edge.id !== id));

        onUpdateNode({
          id: source,
          ...payload,
        });

        updateCachePreviousBlocks("del", source, target);
      }
    },
    [getBlockFromCache, setEdges, onUpdateNode, updateCachePreviousBlocks],
  );
  const handleConnectStart = useCallback(() => {
    const flowPane = document.querySelector(".react-flow__pane");

    if (flowPane && !flowPane.classList.contains("connectStart")) {
      flowPane.classList.add("connectStart");
    }
  }, []);
  const handleConnectEnd = useCallback(() => {
    const flowPane = document.querySelector(".react-flow__pane");

    if (flowPane && flowPane.classList.contains("connectStart")) {
      flowPane.classList.remove("connectStart");
    }
  }, []);

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
      onConnect={onConnect}
      onNodesChange={handleNodesChange}
      onNodeDragStart={handleNodeDragStart}
      onNodeDragStop={handleNodeDragStop}
      onNodeDoubleClick={handleNodeDoubleClick}
      onlyRenderVisibleElements
      onEdgeMouseEnter={handleEdgeMouseEnter}
      onEdgeMouseLeave={handleEdgeMouseLeave}
      onEdgeClick={handleEdgeClick}
      onConnectStart={handleConnectStart}
      onConnectEnd={handleConnectEnd}
    >
      <MiniMap
        className="rf-minimap"
        nodeStrokeColor={(n) => {
          const { type } = n.data;
          const config = getBlockConfigByType(type as TBlock);

          if (n.id.includes("-")) {
            return "transparent";
          }

          return config.color;
        }}
        nodeColor={(n) => {
          const { type } = n.data;
          const config = getBlockConfigByType(type as TBlock);

          if (n.id.includes("-")) {
            return "transparent";
          }

          return `${config.color}99`;
        }}
        maskColor="#0002"
        maskStrokeColor="#999"
        maskStrokeWidth={0.5}
        nodeBorderRadius={18}
        bgColor="#fffa"
        style={{
          overflow: "hidden",
          boxShadow: "0 0 8px #c4c4c4",
          transition: "0.2s",
          borderRadius: "6px",
        }}
      />
      <Controls
        className="rf-controls"
        onFitView={animateFocus}
        fitViewOptions={{ duration: 200 }}
      />
      <Background />
    </ReactFlow>
  );
};
