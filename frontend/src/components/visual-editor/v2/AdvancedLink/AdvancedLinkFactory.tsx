/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { css, keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import {
  DefaultLinkFactory,
  DefaultLinkWidget,
  NodeModel,
  PortModel
} from "@projectstorm/react-diagrams";

import { AdvancedLinkModel } from "./AdvancedLinkModel";

const PROXIMITY_THRESHOLD = 500;
const MIN_DISTANCE = 0.1;
const MAX_DISTANCE = 2000;
const CONTROL_POINT_PADDING = 10;
const BACKWARD_LINK_THRESHOLD = 12; // pixels
const MIN_SCALE_FACTOR = 1.5;
const MAX_SCALE_FACTOR = 2.0;

interface Point {
  x: number;
  y: number;
}

interface Boundaries {
  left: number,
  right: number,
  top: number,
  bottom: number,
}

interface Dimensions {
  width: number,
  height: number,
}
// Helper function to get port dimensions
const getPortDimensions = (port: PortModel): Dimensions => {
  return {
    width: port.width || CONTROL_POINT_PADDING,
    height: port.height || CONTROL_POINT_PADDING,
  };
};
// Helper function to calculate port center point
const getPortCenterPoint = (port: PortModel): Point => {
  const portSize = getPortDimensions(port);

  return {
    x: port.getPosition().x + portSize.width / 2,
    y: port.getPosition().y + portSize.height / 2,
  };
};
/**
 * Logarithmic scaling function that adjusts between 1.5 and 2 based on distance,
 * minimum distance, and maximum distance.
 * @param distance - The distance to scale.
 * @param minDistance - A small value to prevent division by zero or too small values.
 * @param maxDistance - The maximum expected distance.
 */
const logFactor = (
  distance: number,
  minDistance: number,
  maxDistance: number
): number => {
  const scale = Math.log(distance + minDistance) / Math.log(maxDistance + minDistance);

  return MIN_SCALE_FACTOR + scale * (MAX_SCALE_FACTOR - MIN_SCALE_FACTOR); // Scaled to range between 1.5 and 2
};
/**
 * Calculates the horizontal (X-axis) overlap in pixels between two node boundaries.
 * Returns 0 if there is no overlap.
 */
const calculateXOverlap = (
  sourceBounds: Boundaries,
  targetBounds: Boundaries
): number => {
  return Math.max(
    0,
    Math.min(sourceBounds.right, targetBounds.right) -
      Math.max(sourceBounds.left, targetBounds.left)
  );
};
/**
 * Calculates the vertical (Y-axis) overlap in pixels between two node boundaries.
 * Returns 0 if there is no overlap.
 */
const calculateYOverlap = (
  sourceBounds: Boundaries,
  targetBounds: Boundaries
): number => {
  return Math.max(
    0,
    Math.min(sourceBounds.bottom, targetBounds.bottom) -
      Math.max(sourceBounds.top, targetBounds.top)
  );
};
/**
 * Converts an overlap amount into a ratio (0 to 1) based on the larger of the two node dimensions.
 * Useful for dynamically adjusting offsets based on how much nodes visually intersect.
 */
const calculateOverlapRatio = (
  overlapAmount: number,
  sourceDimension: number,
  targetDimension: number
): number => {
  const maxRange = Math.max(sourceDimension, targetDimension);

  return overlapAmount / maxRange;
};
/**
 * Computes the Euclidean distance between two points.
 * Used to scale offsets and curve control points based on how far apart nodes are.
 */
const calculateDistance = (startPoint: Point, endPoint: Point): number => {
  return Math.sqrt(
    Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
  );
};
/**
 * Calculates the bounding box of a node based on its position and size.
 * Returns an object with `left`, `right`, `top`, and `bottom` properties representing the node's edges.
 */
const calculateNodeBoundaries = (node: NodeModel): Boundaries => {
  return {
    left: node.getPosition().x,
    right: node.getPosition().x + node.width,
    top: node.getPosition().y,
    bottom: node.getPosition().y + node.height,
  };
};
/**
 * Calculates the width and height of a node based on the position of one of its ports.
 * 
 * This approach avoids relying on the node's width and height properties,
 * which may not be accurate or available at render time due to asynchronous rendering behavior.
 * 
 * Instead, it uses the relative position of the port to infer the size of the node.
 * Assumes that the port's position reflects the visual layout and placement on the node.
 *
 * @param port - A PortModel instance attached to the node
 * @returns An object containing the inferred width and height of the node
 */
const calculateNodeDimension = (port: PortModel): Dimensions => {
  // Get the top-left position of the node
  const nodePos = port.getNode().getPosition();
  // Get the top-left position of the port
  const portPos = port.getPosition();
  // Width is the horizontal distance from the node's left to the port's right edge
  const width = (portPos.x - nodePos.x) + port.width;
  // Height is estimated by doubling the vertical offset from the node to the port
  // (port is vertically centered), then adding the port's height
  const height = Math.abs(portPos.y - nodePos.y) * 2 + port.height;

  return { width, height };
};
/**
 * Calculates a single control point for a cubic Bézier curve.
 * Adjusts based on direction, dynamic offset, and node boundaries.
 */
const calculateControlPoint = (
  anchor: Point,
  horizontalOffset: number,
  verticalOffset: number,
  verticalDirection: number,
  nodeBounds: Boundaries,
  isStart: boolean,
  controlPointPadding: number
): Point => {
  let x =
    anchor.x + (isStart ? horizontalOffset : -horizontalOffset);
  let y =
    anchor.y + (isStart ? verticalDirection * verticalOffset : -verticalDirection * verticalOffset);

  // Apply minimum horizontal constraint
  x = isStart
    ? Math.max(x, nodeBounds.right + controlPointPadding)
    : Math.min(x, nodeBounds.left - controlPointPadding);

  // Apply vertical constraint based on direction
  y =
    verticalDirection > 0
      ? isStart
        ? Math.max(y, nodeBounds.bottom + controlPointPadding)
        : Math.min(y, nodeBounds.top - controlPointPadding)
      : isStart
      ? Math.min(y, nodeBounds.top - controlPointPadding)
      : Math.max(y, nodeBounds.bottom + controlPointPadding);

  return { x, y };
};
const createCurvedPath = (start: Point, end: Point, nodeHeight: number) => {
  const controlPoint1X = start.x + nodeHeight - 20;
  const controlPoint1Y = start.y - nodeHeight;
  const controlPoint2X = end.x - nodeHeight - 20;
  const controlPoint2Y = end.y - nodeHeight;

  return `M ${start.x},${start.y} C ${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${end.x},${end.y}`;
};
const createBackwardCurvedPath = (
  sourcePort: PortModel,
  targetPort: PortModel,
) => {
  // Set a threshold for node proximity, below which dynamic adjustments to offsets are applied
  // This helps in reducing abrupt curve steepness when nodes are close to each other
  const proximityThreshold = PROXIMITY_THRESHOLD;
  const minDistance = MIN_DISTANCE;
  const maxDistance = MAX_DISTANCE;
  const sourceNode = sourcePort.getNode();
  const targetNode = targetPort.getNode();
  // Get node dimensions
  const { width: sourceNodeWidth, height: sourceNodeHeight } = calculateNodeDimension(sourcePort);
  const { width: targetNodeWidth, height: targetNodeHeight } = calculateNodeDimension(targetPort);
  // Get node boundaries
  const sourceNodeBounds: Boundaries = calculateNodeBoundaries(sourceNode);
  const targetNodeBounds: Boundaries = calculateNodeBoundaries(targetNode);
  // **NEW:** Adjust `start` and `end` to match the exact center of ports
  const adjustedStart: Point = getPortCenterPoint(sourcePort);
  const adjustedEnd: Point = getPortCenterPoint(targetPort);
  // Calculate the distance between nodes
  const nodeDistance: number = calculateDistance(adjustedStart, adjustedEnd);
  // Use node dimensions and distance to calculate dynamic offsets
  const horizontalOffset: number = Math.max(sourceNodeWidth, targetNodeWidth);
  const verticalOffset: number = Math.max(sourceNodeHeight, targetNodeHeight);

  // Dynamic factor, adjusting horizontal and vertical offsets based on the distance
  let adjustedHorizontalOffset: number = horizontalOffset * logFactor(nodeDistance, minDistance, maxDistance);
  let adjustedVerticalOffset: number = verticalOffset * logFactor(nodeDistance, minDistance, maxDistance);

  // Horizontal overlap ratio (0 = no overlap, 1 = fully overlapping horizontally)
  const xOverlapAmount: number = calculateXOverlap(sourceNodeBounds, targetNodeBounds);
  const xOverlapRatio: number = calculateOverlapRatio(xOverlapAmount, sourceNodeWidth, targetNodeWidth);
  // Vertical overlap ratio (0 = no overlap, 1 = fully overlapping vertically)
  const yOverlapAmount: number = calculateYOverlap(sourceNodeBounds, targetNodeBounds);
  const yOverlapRatio: number = calculateOverlapRatio(yOverlapAmount, sourceNodeHeight, targetNodeHeight);
  // Determine vertical direction for Y alignment
  const verticalDirection: number = adjustedEnd.y >= adjustedStart.y ? 1 : -1;

  // If Node Distance is small, multiply offsets by overlap ratios
  // to avoid abrupt curve steepness
  if (nodeDistance < proximityThreshold) {
    adjustedHorizontalOffset *= xOverlapRatio;
    adjustedVerticalOffset *= yOverlapRatio;
  }
  // Compute control points with dynamic offset
  const controlPoint1 = calculateControlPoint(
    adjustedStart,
    adjustedHorizontalOffset,
    adjustedVerticalOffset,
    verticalDirection,
    sourceNodeBounds,
    true,
    CONTROL_POINT_PADDING
  );
  const controlPoint2 = calculateControlPoint(
    adjustedEnd,
    adjustedHorizontalOffset,
    adjustedVerticalOffset,
    verticalDirection,
    targetNodeBounds,
    false,
    CONTROL_POINT_PADDING
  );

  // Return the cubic Bezier curve
  return `M ${adjustedStart.x},${adjustedStart.y} C ${controlPoint1.x},${controlPoint1.y} ${controlPoint2.x},${controlPoint2.y} ${adjustedEnd.x},${adjustedEnd.y}`;
};

namespace S {
  export const Keyframes = keyframes`
		from {
			stroke-dashoffset: 24;
		}
		to {
			stroke-dashoffset: 0;
		}
	`;

  const selected = css`
    stroke-dasharray: 10, 2;
    animation: ${Keyframes} 1s linear infinite;
  `;

  export const Path = styled.path<{ selected: boolean }>`
    ${(p) => p.selected && selected};
    fill: none;
    pointer-events: auto;
  `;
}

export class AdvancedLinkFactory extends DefaultLinkFactory {
  constructor() {
    super("advanced");
  }

  generateModel(): AdvancedLinkModel {
    return new AdvancedLinkModel();
  }

  generateReactWidget(event): JSX.Element {
    return <DefaultLinkWidget link={event.model} diagramEngine={this.engine} />;
  }

  generateLinkSegment(
    model: AdvancedLinkModel,
    selected: boolean,
    path: string,
  ) {  
    const backwardLinkThreshold = BACKWARD_LINK_THRESHOLD;
    const sourcePort = model.getSourcePort();
    const targetPort = model.getTargetPort();
    const isSelfLoop = sourcePort.getNode() === targetPort.getNode();
    const sourcePortPosition = sourcePort.getPosition();
    const targetPortPosition = targetPort.getPosition();
    const startPoint: Point = {
      x: sourcePortPosition.x + 20,
      y: sourcePortPosition.y + 20,
    };
    const endPoint: Point = {
      x: targetPortPosition.x + 20,
      y: targetPortPosition.y + 20,
    };
    // Check if it's a backward link (moving left)
    const isBackward = startPoint.x - endPoint.x > backwardLinkThreshold;

    if (isSelfLoop) {
      // Adjust start Point to match the exact source port's centre
      const adjustedStartPoint: Point = getPortCenterPoint(sourcePort);
      // Handle self-loop (curved) links
      const targetPortHeight = targetPort.height;
      const targetNodeHeight =
        (targetPort.getPosition().y -
        targetPort.getNode().getPosition().y) *
          2 +
        targetPortHeight;

      path = createCurvedPath(adjustedStartPoint, endPoint, targetNodeHeight);
    } else if (isBackward) {
      // Handle backward (leftward) link with refined function
      path = createBackwardCurvedPath(sourcePort, targetPort);
    } 
    
return (
      <S.Path
        selected={selected}
        stroke={
          selected
            ? model.getOptions().selectedColor
            : model.getOptions().color
        }
        strokeWidth={model.getOptions().width}
        d={path}
      />
    );
  }
}