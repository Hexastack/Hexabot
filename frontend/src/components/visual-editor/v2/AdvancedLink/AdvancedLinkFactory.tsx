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
  PortModel
} from "@projectstorm/react-diagrams";

import { AdvancedLinkModel } from "./AdvancedLinkModel";

interface Point {
  x: number;
  y: number;
}

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
  const sourceNode = sourcePort.getNode();
  const targetNode = targetPort.getNode();
  // **NEW:** Get port dimensions for better alignment
  const sourcePortSize = { width: sourcePort.width || 10, height: sourcePort.height || 10 };
  const targetPortSize = { width: targetPort.width || 10, height: targetPort.height || 10 };
  // Get node dimensions
  const sourceNodeWidth = sourceNode.width;
  const targetNodeWidth = targetNode.width;
  const sourceNodeHeight = sourceNode.height;
  const targetNodeHeight = targetNode.height;
  // Get node boundaries
  const sourceNodeBounds = {
    left: sourceNode.getPosition().x,
    right: sourceNode.getPosition().x + sourceNodeWidth,
    top: sourceNode.getPosition().y,
    bottom: sourceNode.getPosition().y + sourceNodeHeight,
  };
  const targetNodeBounds = {
    left: targetNode.getPosition().x,
    right: targetNode.getPosition().x + targetNodeWidth,
    top: targetNode.getPosition().y,
    bottom: targetNode.getPosition().y +targetNodeHeight,
  };
  // **NEW:** Adjust `start` and `end` to match the exact center of ports
  const adjustedStart: Point = {
    x: sourcePort.getPosition().x + sourcePortSize.width / 2,
    y: sourcePort.getPosition().y + sourcePortSize.height / 2,
  };
  const adjustedEnd: Point = {
    x: targetPort.getPosition().x + targetPortSize.width / 2,
    y: targetPort.getPosition().y + targetPortSize.height / 2,
  };
  // Calculate the distance between nodes
  const nodeDistance = Math.sqrt(
    Math.pow(adjustedEnd.x - adjustedStart.x, 2) + Math.pow(adjustedEnd.y - adjustedStart.y, 2)
  );
  // Logarithmic scaling function that adjusts between 1.5 and 2 based on distance
  const logFactor = (distance) => {
    const minDistance = 0.1; // A small value to prevent division by zero or too small values
    const maxDistance = 2000; // A maximum value for nodeDistance where the function plateaus
    // Logarithmic scale function to map distance to a factor between 1.5 and 2
    const scale = Math.log(distance + minDistance) / Math.log(maxDistance + minDistance);

    // Scale result to range between 1.5 and 2
    return 1.5 + scale * (2 - 1.5);
  };
  // Use node dimensions and distance to calculate dynamic offsets
  const horizontalOffset = Math.max(sourceNodeWidth, targetNodeWidth);
  const verticalOffset = Math.max(sourceNodeHeight, targetNodeHeight);

  // Dynamic factor, adjusting horizontal and vertical offsets based on the distance
  let adjustedHorizontalOffset = horizontalOffset*  logFactor(nodeDistance);

  ;
  let adjustedVerticalOffset = verticalOffset * logFactor(nodeDistance);

  // Horizontal overlap ratio (0 = no overlap, 1 = fully overlapping horizontally)
  const xOverlapAmount = Math.max(
    0,
    Math.min(sourceNodeBounds.right, targetNodeBounds.right) -
    Math.max(sourceNodeBounds.left, targetNodeBounds.left)
  );
  const maxXRange = Math.max(sourceNodeWidth, targetNodeWidth);
  const xOverlapRatio = xOverlapAmount / maxXRange;
  // Vertical overlap ratio (0 = no overlap, 1 = fully overlapping vertically)
  const yOverlapAmount = Math.max(
    0,
    Math.min(sourceNodeBounds.bottom, targetNodeBounds.bottom) -
    Math.max(sourceNodeBounds.top, targetNodeBounds.top)
  );
  const maxYRange = Math.max(sourceNodeHeight, targetNodeHeight);
  const yOverlapRatio = yOverlapAmount / maxYRange;
  // Determine vertical direction for Y alignment
  const verticalDirection = adjustedEnd.y >= adjustedStart.y ? 1 : -1;

  // If Node Distance is small, multiply offsets by overlap ratios
  // to avoid abrupt curve steepness
  if (nodeDistance < 500) {
    adjustedHorizontalOffset *= xOverlapRatio; 
    adjustedVerticalOffset *= yOverlapRatio;  
  }
  // Compute control points with dynamic offset
  let controlPoint1X = adjustedStart.x + adjustedHorizontalOffset;
  let controlPoint1Y = adjustedStart.y + verticalDirection * adjustedVerticalOffset;

  let controlPoint2X = adjustedEnd.x - adjustedHorizontalOffset;
  let controlPoint2Y = adjustedEnd.y - verticalDirection * adjustedVerticalOffset;

  controlPoint1X = Math.max(controlPoint1X, sourceNodeBounds.right + 10);
  controlPoint2X = Math.min(controlPoint2X, targetNodeBounds.left - 10);

  controlPoint1Y = verticalDirection > 0
    ? Math.max(controlPoint1Y, sourceNodeBounds.bottom + 10)
    : Math.min(controlPoint1Y, sourceNodeBounds.top - 10);

  controlPoint2Y = verticalDirection > 0
    ? Math.min(controlPoint2Y, targetNodeBounds.top - 10)
    : Math.max(controlPoint2Y, targetNodeBounds.bottom + 10);

  // Return the cubic Bezier curve
  return `M ${adjustedStart.x},${adjustedStart.y} C ${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${adjustedEnd.x},${adjustedEnd.y}`;
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

    const sourcePort = model.getSourcePort();
    const targetPort = model.getTargetPort();
    const isSelfLoop =
    sourcePort.getNode() === targetPort.getNode();
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
    const isBackward = startPoint.x - endPoint.x > 12;

    if (isSelfLoop) {
      const sourcePortSize = { width:sourcePort.width || 10, height:sourcePort.height || 10 };
      // Adjust start Point to match the exact source port's centre
      const adjustedStartPoint: Point = {
        x: sourcePortPosition.x + sourcePortSize.width / 2,
        y: sourcePortPosition.y + sourcePortSize.height / 2,
      };
      // Handle self-loop (curved) links
      const targetPortHeight =targetPort.height;
      const targetNdeHeight =
        (targetPort.getPosition().y -
        targetPort.getNode().getPosition().y) *
          2 +
        targetPortHeight;

      path = createCurvedPath(adjustedStartPoint, endPoint, targetNdeHeight);
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