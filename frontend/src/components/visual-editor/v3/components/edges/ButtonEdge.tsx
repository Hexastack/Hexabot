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
  type EdgeProps,
} from "@xyflow/react";
import { useMemo } from "react";

import { useUpdate } from "@/hooks/crud/useUpdate";
import { EntityType } from "@/services/types";
import { IBlockAttributes } from "@/types/block.types";

import { useVisualEditor } from "../../hooks/useVisualEditor";

export const EDGE_HOVER_CLASSNAME = "hovered" as const;

const getEdgeClasslist = (edgeId: string) =>
  document.querySelector(`[data-id="${edgeId}"]`)?.classList;

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
  const { setEdges, getEdges, getBlockFromCache } = useVisualEditor();
  const edge = useMemo(
    () => getEdges().find((e) => e.id === id),
    [getEdges, id],
  );
  const onEdgeClick = () => {
    if (edge?.source) {
      const block = getBlockFromCache(edge.source);
      const payload: Partial<IBlockAttributes> =
        edge.sourceHandle === "nextBlocks"
          ? {
              nextBlocks: block?.nextBlocks?.filter((n) => n !== edge.target),
            }
          : { attachedBlock: null };

      setEdges((edges) => edges.filter((edge) => edge.id !== id));

      updateBlock({
        id: edge.source,
        params: payload,
      });
    }
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
          <button
            className="button-edge__button"
            onClick={onEdgeClick}
            onMouseEnter={() => {
              if (edge) {
                const edgeClasslist = getEdgeClasslist(edge.id);

                if (edgeClasslist && !edgeClasslist.contains("hovered")) {
                  edgeClasslist.add("hovered");
                }
              }
            }}
            onMouseLeave={() => {
              if (edge) {
                const edgeClasslist = getEdgeClasslist(edge.id);

                if (edgeClasslist?.contains("hovered")) {
                  edgeClasslist.remove("hovered");
                }
              }
            }}
          >
            ×
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
