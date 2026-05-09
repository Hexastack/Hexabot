/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { type NodeProps } from "@xyflow/react";
import { type FC } from "react";

import { WorkflowNodeProvider } from "../../../providers/WorkflowNodeProvider";
import { ENodeType, type GraphNode } from "../../../types/workflow-node.types";
import { GenericNodeContainer } from "../GenericNodeContainer";
import { GenericNodePorts } from "../GenericNodePorts";

export const Group: FC<NodeProps<GraphNode<ENodeType.GROUP>>> = (props) => (
  <WorkflowNodeProvider node={props}>
    <GenericNodeContainer>
      <GenericNodePorts />
    </GenericNodeContainer>
  </WorkflowNodeProvider>
);
