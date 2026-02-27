/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { NodeProps } from "@xyflow/react";
import type { FC } from "react";

import { WorkflowNodeProvider } from "../../../../providers/WorkflowNodeProvider";
import {
  ENodeType,
  type GraphNode,
} from "../../../../types/workflow-node.types";
import { GenericNodeContainer } from "../../GenericNodeContainer";
import { GenericNodePorts } from "../../GenericNodePorts";
import { GenericNodeRightContent } from "../../GenericNodeRightContent";
import { GenericNodeTitle } from "../../GenericNodeTitle";

export const Model: FC<NodeProps<GraphNode<ENodeType.MODEL>>> = ({ id }) => (
  <WorkflowNodeProvider id={id}>
    <GenericNodeContainer>
      <GenericNodeRightContent>
        <GenericNodeTitle />
      </GenericNodeRightContent>
      <GenericNodePorts />
    </GenericNodeContainer>
  </WorkflowNodeProvider>
);
