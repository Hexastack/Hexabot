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
  getEdgeCenter,
  type EdgeProps,
} from "@xyflow/react";
import { useMemo } from "react";

import { BACKWARD_EDGE_BEZIER_CURVATURE } from "../../constants";
import { getEdgeType } from "../../utils/edge.utils";

export const EDGE_HOVER_CLASSNAME = "hovered" as const;

export const EdgeWithButton = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  source,
  target,
}: EdgeProps) => {
  const [path, labelX, labelY] = useMemo(() => {
    const edgeType = getEdgeType({
      source,
      sourceX,
      sourceY,
      target,
      targetX,
      targetY,
    });

    switch (edgeType) {
      case "selfConnectingEdge": {
        const radiusX = (sourceX - targetX) * 0.6;
        const radiusY = 100;
        const path = `M ${sourceX} ${sourceY} A ${radiusX} ${radiusY} -2 1 0 ${targetX} ${targetY}`;
        const [labelX, labelY] = getEdgeCenter({
          sourceX,
          sourceY,
          targetX,
          targetY,
        });

        return [path, labelX, labelY - 155];
      }
      case "backwardEdge":
        return getBezierPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
          sourcePosition,
          targetPosition,
          curvature: BACKWARD_EDGE_BEZIER_CURVATURE,
        });

      case "defaultEdge":
        return getBezierPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
          sourcePosition,
          targetPosition,
        });
    }
  }, [
    source,
    sourceX,
    sourceY,
    target,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  ]);

  return (
    <>
      <BaseEdge path={path} markerEnd={markerEnd} style={style} />
      {source.includes("-") ? null : (
        <EdgeLabelRenderer>
          <div
            data-link-id={id}
            className="button-edge__label nodrag nopan"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
          >
            <button className="button-edge__button">×</button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
