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
import { GenericNodeDescription } from "../../GenericNodeDescription";
import { GenericNodePorts } from "../../GenericNodePorts";
import { GenericNodeRightContent } from "../../GenericNodeRightContent";
import { GenericNodeTitle } from "../../GenericNodeTitle";

export const Memory: FC<NodeProps<GraphNode<ENodeType.MEMORY>>> = ({ id }) => (
  <WorkflowNodeProvider id={id}>
    <GenericNodeContainer>
      <GenericNodeRightContent>
        <GenericNodeTitle />
        <GenericNodeDescription />
      </GenericNodeRightContent>
      <GenericNodePorts />
    </GenericNodeContainer>
  </WorkflowNodeProvider>
);
