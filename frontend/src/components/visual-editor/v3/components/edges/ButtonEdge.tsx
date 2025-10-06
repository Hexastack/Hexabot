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

import { BACKWARD_EDGE_BEZIER_CURVATURE } from "../../constants";
import { isBackwardLink } from "../../utils/edge.utils";

export const EDGE_HOVER_CLASSNAME = "hovered" as const;

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
  source,
}: EdgeProps) {
  const [path, labelX, labelY] = useMemo(() => {
    const isBackward = isBackwardLink({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    });

    return getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      curvature: isBackward ? BACKWARD_EDGE_BEZIER_CURVATURE : 0,
    });
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);

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
}
