import { css, keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import {
  DefaultLinkFactory,
  DefaultLinkWidget,
} from "@projectstorm/react-diagrams";
import React from "react";

import { AdvancedLinkModel } from "./AdvancedLinkModel";

interface Point {
  x: number;
  y: number;
}

const createCurvedPath = (start: Point, end: Point) => {
  const controlPoint1X = start.x + 220;
  const controlPoint1Y = start.y - 250;
  const controlPoint2X = end.x - 250;
  const controlPoint2Y = end.y - 250;

  return `M ${start.x},${start.y} C ${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${end.x},${end.y}`;
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
    const isSelfLoop =
      model.getSourcePort().getNode() === model.getTargetPort().getNode();

    if (isSelfLoop) {
      // Adjust the path to create a curve
      const sourcePortPosition = model.getSourcePort().getPosition();
      const targetPortPosition = model.getTargetPort().getPosition();
      const startPoint: Point = {
        x: sourcePortPosition.x + 20,
        y: sourcePortPosition.y + 20,
      };
      const endPoint: Point = {
        x: targetPortPosition.x + 20,
        y: targetPortPosition.y + 20,
      };

      path = createCurvedPath(startPoint, endPoint);
    }

    return (
      <S.Path
        selected={selected}
        stroke={
          selected ? model.getOptions().selectedColor : model.getOptions().color
        }
        strokeWidth={model.getOptions().width}
        d={path}
      />
    );
  }
}
