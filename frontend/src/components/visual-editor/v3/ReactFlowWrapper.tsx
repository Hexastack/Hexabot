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
  Viewport,
} from "@xyflow/react";
import { useCallback, useEffect } from "react";

import "@xyflow/react/dist/style.css";
// import DarkModeControl from "./components/DarkModeControl";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { EntityType } from "@/services/types";

import { useVisualEditorV3 } from "./hooks/useVisualEditorV3";
import CustomNode from "./nodes/CustomNode";

const NODE_TYPES = {
  block: CustomNode,
} as const;
const EDGE_TYPES = {};
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
  defaultEdges: any;
  onMoveNode: any;
  onViewport: any;
  onDeleteNodes: (ids: string[], cb?: () => void) => void;
  onNodeDoubleClick: (selectedBlockId: string) => void;
}) => {
  useOnViewportChange({ onEnd: onViewport });
  const {
    setEdges,
    setNodes,
    nodes,
    deleteElements,
    selectedNodes,
    setSelectedNodes,
    selectedEdges,
    setSelectedEdges,
  } = useVisualEditorV3();
  const deleteKeyPressed = useKeyPress("Delete");
  const getBlockFromCache = useGetFromCache(EntityType.BLOCK);
  // const [colorMode, setColorMode] = useState<ColorMode>("light");
  // const onColorChange: ChangeEventHandler<HTMLSelectElement> = (evt) => {
  //   setColorMode(evt.target.value as ColorMode);
  // };
  const onConnect: OnConnect = (params) => {
    const { source: sourceNodeId, target: targetNodeId } = params;
    const sourceNode = getBlockFromCache(sourceNodeId);

    onMoveNode({
      id: sourceNodeId,
      nextBlocks: [
        ...(sourceNode?.nextBlocks || []).filter((id) => id !== targetNodeId),
        targetNodeId,
      ],
    });
    setEdges((eds) => [...eds, params as Edge]);
  };
  const onNodesChange: OnNodesChange<Node> = useCallback(
    (changes) => {
      const selectedNode = changes[0];

      setNodes(() => {
        if (selectedNode["id"] && selectedNode["position"]) {
          onMoveNode({
            id: selectedNode["id"],
            position: selectedNode["position"],
          });
        }

        return applyNodeChanges(changes, nodes);
      });
    },
    [setNodes],
  );
  const handleNodeDoubleClick: NodeMouseHandler<Node> = useCallback(
    (_, { id }) => {
      if (selectedNodes.length === 1 && !selectedEdges.length)
        onNodeDoubleClick(id);
    },
    [selectedNodes.length, selectedEdges.length, onNodeDoubleClick],
  );

  useEffect(() => {
    if (deleteKeyPressed) {
      if (selectedNodes.length) {
        const ids = selectedNodes.map(({ id }) => id);

        onDeleteNodes(ids, () => {
          deleteElements({ nodes: selectedNodes });
        });
      }
      if (selectedEdges.length) {
        deleteElements({ edges: selectedEdges });
      }
    }
  }, [
    onDeleteNodes,
    selectedNodes,
    deleteKeyPressed,
    selectedEdges,
    deleteElements,
  ]);

  // useEffect(() => {
  //   setEdges(defaultEdges);
  // }, [defaultEdges]);

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
      onSelectionChange={({ edges, nodes }) => {
        setSelectedNodes(nodes);
        setSelectedEdges(edges);
      }}
      onEdgesChange={(changes) => {
        setSelectedEdges(changes as any);
      }}
      onlyRenderVisibleElements
    >
      <MiniMap />
      <Controls />
      <Background />
      {/* <DarkModeControl onChange={onColorChange} /> */}
    </ReactFlow>
  );
};

export default CanvasV3;
