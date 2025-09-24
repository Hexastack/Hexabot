/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  applyNodeChanges,
  Background,
  Controls,
  Edge,
  MiniMap,
  Node,
  NodeMouseHandler,
  OnConnect,
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
import { useGetFromCache } from "@/hooks/crud/useGet";
import { EntityType } from "@/services/types";
import { IBlock, IBlockAttributes } from "@/types/block.types";

import ButtonEdge from "./edges/buttonEdge/ButtonEdge";
import { useVisualEditorV3 } from "./hooks/useVisualEditorV3";
import CustomNode from "./nodes/CustomNode";
import "./styles/index.css";
import { EdgeLink } from "./types/visual-editor.types";

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
  onDeleteNodes: (ids: string[], cb?: () => void) => void;
  onNodeDoubleClick: (selectedBlockId: string) => void;
}) => {
  useOnViewportChange({ onEnd: onViewport });
  const { setEdges, setNodes, deleteElements } = useReactFlow();
  const { setSelectedNodeIds, selectedNodeIds } = useVisualEditorV3();
  const deleteKeyPressed = useKeyPress("Delete");
  const getBlockFromCache = useGetFromCache(EntityType.BLOCK);
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

    onMoveNode({
      id: sourceNodeId,
      ...payload,
    });
    setEdges((eds) => [...eds, params as Edge]);
  };
  const onNodesChange: OnNodesChange<Node> = useCallback(
    (changes) => {
      // const selectedNode = changes[0];

      setNodes((nodes) => {
        // if (selectedNode["id"] && selectedNode["position"]) {
        //   onMoveNode({
        //     id: selectedNode["id"],
        //     position: selectedNode["position"],
        //   });
        // }

        return applyNodeChanges(changes, nodes);
      });
    },
    [setNodes],
  );
  const handleNodeDoubleClick: NodeMouseHandler<Node> = useCallback(
    (_, { id }) => {
      if (selectedNodeIds.length === 1) onNodeDoubleClick(id);
    },
    [selectedNodeIds.length, onNodeDoubleClick],
  );

  useEffect(() => {
    if (deleteKeyPressed) {
      if (selectedNodeIds.length) {
        onDeleteNodes(selectedNodeIds, () => {
          // deleteElements({ nodes: selectedNodes });
        });
      }
    }
  }, [onDeleteNodes, selectedNodeIds, deleteKeyPressed, deleteElements]);

  return (
    <ReactFlow
      edges={defaultEdges}
      defaultEdges={defaultEdges}
      defaultNodes={defaultNodes}
      nodes={defaultNodes}
      defaultViewport={defaultViewport}
      maxZoom={4}
      minZoom={-2}
      nodeTypes={NODE_TYPES as any}
      edgeTypes={EDGE_TYPES}
      onConnect={onConnect}
      onNodesChange={onNodesChange}
      // colorMode={colorMode}
      onNodeDoubleClick={handleNodeDoubleClick}
      onSelectionChange={({ nodes }) => {
        setSelectedNodeIds(nodes.map(({ id }) => id));
      }}
      onlyRenderVisibleElements
      onNodeDragStop={(_, node, nodes) => {
        if (nodes.length === 1) {
          onMoveNode({
            id: node.id,
            position: node.position,
          });
        } else {
        }
      }}
    >
      <MiniMap />
      <Controls />
      <Background />
      {/* <DarkModeControl onChange={onColorChange} /> */}
    </ReactFlow>
  );
};

export default CanvasV3;
