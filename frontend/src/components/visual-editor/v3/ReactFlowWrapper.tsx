/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  Background,
  Controls,
  Edge,
  MiniMap,
  Node,
  NodeMouseHandler,
  OnConnect,
  ReactFlow,
  useKeyPress,
  useNodesInitialized,
  useOnViewportChange,
  Viewport,
} from "@xyflow/react";
import { useCallback, useEffect } from "react";

import "@xyflow/react/dist/style.css";

// import DarkModeControl from "./components/DarkModeControl";
import { IBlock, IBlockAttributes } from "@/types/block.types";
import { TBlock } from "@/types/visual-editor.types";

import CustomNode from "./components/node/CustomNode";
import ButtonEdge from "./edges/buttonEdge/ButtonEdge";
import { useDeleteManyBlocksDialog } from "./hooks/useDeleteManyBlocksDialog";
import { useEditBlockDialog } from "./hooks/useEditBlockDialog";
import { useVisualEditorV3 } from "./hooks/useVisualEditorV3";
import "./styles/index.css";
import { EdgeLink } from "./types/visual-editor.types";
import { getBlockConfigByType } from "./utils/block.utils";

const NODE_TYPES = {
  block: CustomNode,
} as const;
const EDGE_TYPES = { buttonedge: ButtonEdge };
const CanvasV3 = ({
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
    setSelectedNodeIds,
    selectedNodeIds,
    setEdges,
    getBlockFromCache,
    setViewport,
  } = useVisualEditorV3();
  const nodesInitialized = useNodesInitialized();
  const deleteKeyPressed = useKeyPress("Delete");
  const { openDeleteManyDialog } = useDeleteManyBlocksDialog();
  const { openEditDialog } = useEditBlockDialog();
  // const [colorMode, setColorMode] = useState<ColorMode>("light");
  // const onColorChange: ChangeEventHandler<HTMLSelectElement> = (evt) => {
  //   setColorMode(evt.target.value as ColorMode);
  // };
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

    setEdges((eds) => [...eds, params as Edge]);

    onMoveNode({
      id: sourceNodeId,
      ...payload,
    });
  };
  const handleNodeDoubleClick: NodeMouseHandler<Node> = useCallback(
    (_, { id }) => {
      if (selectedNodeIds.length === 1) {
        onNodeDoubleClick?.(id) || openEditDialog(id);
      }
    },
    [selectedNodeIds.length, onNodeDoubleClick],
  );

  useOnViewportChange({
    onEnd: onViewport,
  });

  useEffect(() => {
    if (deleteKeyPressed) {
      if (selectedNodeIds.length) {
        openDeleteManyDialog(selectedNodeIds);
      }
    }
  }, [onDeleteNodes, selectedNodeIds, deleteKeyPressed]);

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
      // onNodesChange={onNodesChange}
      // colorMode={colorMode}
      onNodeClick={(_e, node) => {
        if (!selectedNodeIds.includes(node.id)) {
          setSelectedNodeIds((nodes) => [...nodes, node.id]);
        }
      }}
      onNodeDoubleClick={handleNodeDoubleClick}
      onSelectionChange={({ nodes }) => {
        const selectedNodes = nodes.map(({ id }) => id);

        if (selectedNodes.length !== selectedNodeIds.length) {
          setSelectedNodeIds(selectedNodes);
        }
      }}
      onlyRenderVisibleElements
      onNodeDragStop={(_e, node, nodes) => {
        if (nodes.length === 1) {
          onMoveNode({
            id: node.id,
            position: node.position,
          });
        } else {
        }
      }}
    >
      <MiniMap
        nodeStrokeColor={(n) => {
          const { type } = n.data;
          const config = getBlockConfigByType(type as TBlock);

          return config.color;
        }}
        nodeColor={(n) => {
          const { type } = n.data;
          const config = getBlockConfigByType(type as TBlock);

          return `${config.color}11`;
        }}
        nodeBorderRadius={18}
      />
      <Controls />
      <Background />
      {/* <DarkModeControl onChange={onColorChange} /> */}
    </ReactFlow>
  );
};

export default CanvasV3;
