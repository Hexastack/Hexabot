/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import { useMemo } from "react";

import { useGetFromCache } from "@/hooks/crud/useGet";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { EntityType } from "@/services/types";
import { IBlockAttributes } from "@/types/block.types";

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const { mutate: updateBlock } = useUpdate(EntityType.BLOCK, {
    invalidate: false,
  });
  const { setEdges, getEdges } = useReactFlow();
  const getBlockFromCache = useGetFromCache(EntityType.BLOCK);
  const edge = useMemo(() => {
    return getEdges().find((e) => e.id === id);
  }, [getEdges, id]);
  const onEdgeClick = () => {
    if (edge?.source) {
      const block = getBlockFromCache(edge.source);
      const payload: Partial<IBlockAttributes> =
        edge.sourceHandle === "nextBlocks"
          ? {
              nextBlocks: block?.nextBlocks?.filter((n) => n !== edge.target),
            }
          : { attachedBlock: null };

      updateBlock({
        id: edge.source,
        params: payload,
      });
    }
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className="button-edge__label nodrag nopan"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          <button className="button-edge__button" onClick={onEdgeClick}>
            ×
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
