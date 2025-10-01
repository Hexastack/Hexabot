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
  MiniMap,
  Node,
  NodeMouseHandler,
  OnConnect,
  OnNodeDrag,
  ReactFlow,
  useKeyPress,
  useNodesInitialized,
  useOnViewportChange,
  useReactFlow,
  Viewport,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo } from "react";

import "@xyflow/react/dist/style.css";

// import DarkModeControl from "./components/DarkModeControl";

import { IBlock, IBlockAttributes } from "@/types/block.types";

import { useDeleteManyBlocksDialog } from "../hooks/useDeleteManyBlocksDialog";
import { useEditBlockDialog } from "../hooks/useEditBlockDialog";
import { useFocusBlock } from "../hooks/useFocusBlock";
import { useVisualEditor } from "../hooks/useVisualEditor";
import { EdgeLink, TBlock } from "../types/visual-editor.types";
import { getBlockConfigByType } from "../utils/block.utils";

import ButtonEdge from "./edges/ButtonEdge";
import CustomNode from "./nodes/NodeBlock";

const NODE_TYPES = {
  block: CustomNode,
} as const;
const EDGE_TYPES = { buttonedge: ButtonEdge };

export const ReactFlowWrapper = ({
  defaultEdges,
  defaultNodes,
  defaultViewport,
  onMoveNode,
  onViewport,
  onDeleteNodes,
  onNodeDoubleClick,
}: {
  defaultNodes: Node[];
  defaultViewport: Viewport;
  defaultEdges: EdgeLink[];
  onMoveNode: ({ id, ...rest }: Partial<IBlock> & { id: string }) => void;
  onViewport: ({ zoom, x, y }: Viewport) => void;
  onDeleteNodes?: (ids: string[]) => void;
  onNodeDoubleClick?: (selectedBlockId: string) => void;
}) => {
  const {
    removeBlockIdParam,
    updateVisualEditorURL,
    getQuery,
    openSearchPanel,
    animateFocus,
  } = useFocusBlock();
  const { setEdges, setViewport } = useReactFlow();
  const {
    setSelectedNodeIds,
    selectedNodeIds,
    getBlockFromCache,
    selectedCategoryId,
  } = useVisualEditor();
  const nodesInitialized = useNodesInitialized();
  const deleteKeyPressed = useKeyPress("Delete");
  const { openDeleteManyDialog } = useDeleteManyBlocksDialog();
  const { openEditDialog } = useEditBlockDialog();
  const blockId = useMemo(() => getQuery("blockId"), [getQuery]);
  const onConnect: OnConnect = (params) => {
    const { source: sourceNodeId, target: targetNodeId, sourceHandle } = params;
    const sourceNode = getBlockFromCache(sourceNodeId);
    const payload: Partial<IBlockAttributes> =
      sourceHandle === "nextBlocks"
        ? {
            nextBlocks: [
              ...(sourceNode?.nextBlocks || []).filter(
                (id) => id !== targetNodeId,
              ),
              targetNodeId,
            ],
          }
        : { attachedBlock: targetNodeId };

    setEdges((eds) => addEdge({ ...params, type: "buttonedge" }, eds));

    onMoveNode({
      id: sourceNodeId,
      ...payload,
    });
  };
  const handleNodeClick: NodeMouseHandler<Node> = useCallback(
    (e, { id }) => {
      if (!selectedNodeIds.includes(id)) {
        if (selectedCategoryId && !e.ctrlKey) {
          updateVisualEditorURL(selectedCategoryId, id);
          setSelectedNodeIds([id]);
        } else {
          setSelectedNodeIds((nodes) => [...nodes, id]);
        }
      }
    },
    [
      selectedCategoryId,
      selectedNodeIds,
      setSelectedNodeIds,
      updateVisualEditorURL,
    ],
  );
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
        updateVisualEditorURL(selectedCategoryId, id);
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
        for (const { id, position } of nodes) {
          onMoveNode({
            id,
            position,
          });
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Unable to update node", e);
      }
    },
    [onMoveNode],
  );

  useOnViewportChange({
    onEnd: onViewport,
  });

  useEffect(() => {
    if (deleteKeyPressed && selectedNodeIds.length) {
      openDeleteManyDialog(selectedNodeIds).then((confirm) => {
        if (confirm) {
          removeBlockIdParam();
        }
      });
    }
  }, [
    onDeleteNodes,
    selectedNodeIds,
    deleteKeyPressed,
    openDeleteManyDialog,
    removeBlockIdParam,
  ]);

  useEffect(() => {
    setViewport(defaultViewport);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodesInitialized]);

  return (
    <ReactFlow
      defaultEdges={defaultEdges}
      edges={defaultEdges}
      defaultNodes={defaultNodes}
      nodes={defaultNodes}
      defaultViewport={defaultViewport}
      maxZoom={4}
      minZoom={-2}
      nodeTypes={NODE_TYPES as any}
      edgeTypes={EDGE_TYPES}
      onConnect={onConnect}
      onNodeClick={handleNodeClick}
      onNodeDoubleClick={handleNodeDoubleClick}
      onSelectionChange={({ nodes }) => {
        const selectedNodes = nodes.map(({ id }) => id);

        if (blockId && nodes.length > 1) {
          removeBlockIdParam();
        } else if (!blockId && nodes.length === 1 && selectedCategoryId) {
          updateVisualEditorURL(selectedCategoryId, nodes[0].id);
        }

        if (selectedNodes.length !== selectedNodeIds.length) {
          setSelectedNodeIds(selectedNodes);

          if (
            !selectedNodes.includes(blockId) &&
            !selectedNodes.length &&
            !openSearchPanel
          ) {
            removeBlockIdParam();
          }
        }
      }}
      onlyRenderVisibleElements
      onNodeDragStart={handleNodeDragStart}
      onNodeDragStop={handleNodeDragStop}
    >
      <MiniMap
        className="rf-minimap"
        nodeStrokeColor={(n) => {
          const { type } = n.data;
          const config = getBlockConfigByType(type as TBlock);

          return config.color;
        }}
        nodeColor={(n) => {
          const { type } = n.data;
          const config = getBlockConfigByType(type as TBlock);

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
