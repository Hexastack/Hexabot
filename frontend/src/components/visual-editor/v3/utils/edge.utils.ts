/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  type EdgePosition,
  getBezierPath,
  GetBezierPathParams,
} from "@xyflow/system";

import { BACKWARD_LINK_THRESHOLD } from "../constants";

export const getSpecialPath = (
  { sourceX, sourceY, targetX, targetY }: EdgePosition,
  offset: number,
): string => {
  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;

  return `M ${sourceX} ${sourceY} Q ${centerX} ${
    centerY + offset
  } ${targetX} ${targetY}`;
};

export const getCurvedBezierEdge = (
  props: EdgePosition,
  curvature?: number,
) => {
  return getBezierPath({ ...props, curvature });
};

export const isBackwardEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
}: GetBezierPathParams): boolean => {
  const sourcePortPosition = { x: sourceX, y: sourceY };
  const targetPortPosition = { x: targetX, y: targetY };
  const startPoint = {
    x: sourcePortPosition.x + 20,
    y: sourcePortPosition.y + 20,
  };
  const endPoint = {
    x: targetPortPosition.x + 20,
    y: targetPortPosition.y + 20,
  };
  const isBackward = startPoint.x - endPoint.x > BACKWARD_LINK_THRESHOLD;

  return isBackward;
};

export const getEdgeType = ({
  source,
  sourceX,
  sourceY,
  target,
  targetX,
  targetY,
}: GetBezierPathParams & {
  source: string;
  target: string;
}): "selfConnectingEdge" | "backwardEdge" | "defaultEdge" => {
  if (source && target && source === target) {
    return "selfConnectingEdge";
  } else if (isBackwardEdge({ sourceX, sourceY, targetX, targetY })) {
    return "backwardEdge";
  } else {
    return "defaultEdge";
  }
};
