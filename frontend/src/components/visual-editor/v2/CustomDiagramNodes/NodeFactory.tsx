/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { AbstractReactFactory } from "@projectstorm/react-canvas-core";
import { DiagramEngine } from "@projectstorm/react-diagrams-core";
import * as React from "react";

import { NodeModel } from "./NodeModel";
import NodeWidget from "./NodeWidget";

export class NodeFactory extends AbstractReactFactory<
  NodeModel,
  DiagramEngine
> {
  constructor() {
    super("ts-custom-node");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generateModel(initialConfig) {
    return new NodeModel();
  }

  generateReactWidget(event): JSX.Element {
    return (
      // @todo
      // @ts-expect-error fix the following ts
      <NodeWidget engine={this.engine as DiagramEngine} node={event.model} />
    );
  }
}
