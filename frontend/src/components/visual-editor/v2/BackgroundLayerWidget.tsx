/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { CanvasModel } from "@projectstorm/react-canvas-core";
import * as React from "react";
import { CSSProperties } from "react";

export interface BackgroundLayerWidgetProps {
  model: CanvasModel;
}

namespace S {
  const shared = css`
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    position: absolute;
    pointer-events: none;
    transform-origin: 0 0;
    width: 200%;
    height: 200%;
    overflow: visible;
    background-color: #f2f4f7;
    background-image: radial-gradient(
      circle,
      rgba(0, 0, 0, 0.075) 8%,
      transparent 10%
    );
    background-size: 16px 16px;
  `;

  export const DivLayer = styled.div`
    ${shared}
  `;
}

export class BackgroundLayerWidget extends React.Component<
  React.PropsWithChildren<BackgroundLayerWidgetProps>
> {
  constructor(props: BackgroundLayerWidgetProps) {
    super(props);
    this.state = {};
  }

  getTransformStyle(): CSSProperties {
    return {
      backgroundPosition: `${this.props.model.getOffsetX()}px ${this.props.model.getOffsetY()}px`,
    };
  }

  render() {
    return <S.DivLayer style={this.getTransformStyle()} />;
  }
}
