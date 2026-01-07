/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";
import { useMemo } from "react";

export const EDGE_HOVER_CLASSNAME = "hovered" as const;

export const EdgeWithButton = ({
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
  label,
}: EdgeProps) => {
  const [path] = useMemo(() => {
    return getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    });
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
      <BaseEdge {...{ path, style, markerEnd }} />
      <text
        x={(sourceX + targetX) / 2}
        y={(sourceY + targetY) / 2}
        fill="black"
        fontSize={14}
        textAnchor="middle"
        dy={0}
      >
        {label}
      </text>
    </>
  );
};
