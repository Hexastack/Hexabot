/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import styled from "@emotion/styled";
import {
  CanvasEngine,
  SmartLayerWidget,
  TransformLayerWidget,
} from "@projectstorm/react-diagrams";
import * as React from "react";

import { BackgroundLayerWidget } from "./BackgroundLayerWidget";

export interface DiagramProps {
  engine: CanvasEngine;
  className?: string;
}

namespace S {
  export const Canvas = styled.div`
    position: relative;
    cursor: move;
    overflow: hidden;
  `;
}

export class CustomCanvasWidget extends React.Component<DiagramProps> {
  ref: React.RefObject<HTMLDivElement>;
  keyUp: any;
  keyDown: any;
  canvasListener: any;

  constructor(props: DiagramProps) {
    super(props);

    this.ref = React.createRef();
    this.state = {
      action: null,
      diagramEngineListener: null,
    };
  }

  componentWillUnmount() {
    this.props.engine.deregisterListener(this.canvasListener);
    this.props.engine.setCanvas(undefined);

    this.ref.current?.parentElement?.removeEventListener("keyup", this.keyUp);
    this.ref.current?.parentElement?.removeEventListener(
      "keydown",
      this.keyDown,
    );
  }

  registerCanvas() {
    this.props.engine.setCanvas(this.ref.current || undefined);
    this.props.engine.iterateListeners((list) => {
      list.rendered && list.rendered();
    });
  }

  componentDidUpdate() {
    this.registerCanvas();
  }

  componentDidMount() {
    this.canvasListener = this.props.engine.registerListener({
      repaintCanvas: () => {
        this.forceUpdate();
      },
    });

    this.keyDown = (event) => {
      this.props.engine.getActionEventBus().fireAction({ event });
    };
    this.keyUp = (event) => {
      this.props.engine.getActionEventBus().fireAction({ event });
    };

    this.ref.current?.parentElement?.addEventListener("keyup", this.keyUp);
    this.ref.current?.parentElement?.addEventListener("keydown", this.keyDown);
    this.registerCanvas();
  }

  render() {
    const engine = this.props.engine;
    const model = engine.getModel();

    return (
      <div className="canvas-container" tabIndex={0}>
        <S.Canvas
          className={this.props.className}
          ref={this.ref}
          onWheel={(event) => {
            this.props.engine.getActionEventBus().fireAction({ event });
          }}
          onMouseDown={(event) => {
            this.props.engine.getActionEventBus().fireAction({ event });
          }}
          onMouseUp={(event) => {
            this.props.engine.getActionEventBus().fireAction({ event });
          }}
          onMouseMove={(event) => {
            this.props.engine.getActionEventBus().fireAction({ event });
          }}
          onTouchStart={(event) => {
            this.props.engine.getActionEventBus().fireAction({ event });
          }}
          onTouchEnd={(event) => {
            this.props.engine.getActionEventBus().fireAction({ event });
          }}
          onTouchMove={(event) => {
            this.props.engine.getActionEventBus().fireAction({ event });
          }}
        >
          <BackgroundLayerWidget model={model} />;
          {model.getLayers().map((layer) => {
            return (
              <TransformLayerWidget layer={layer} key={layer.getID()}>
                <SmartLayerWidget
                  layer={layer}
                  engine={this.props.engine}
                  key={layer.getID()}
                />
              </TransformLayerWidget>
            );
          })}
        </S.Canvas>
      </div>
    );
  }
}
