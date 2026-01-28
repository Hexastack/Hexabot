/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { NodeProps } from "@xyflow/react";
import { FC } from "react";

import { WorkflowNodeProvider } from "../../../providers/WorkflowNodeProvider";
import {
  ELinkType,
  ENodeType,
  GraphNode,
} from "../../../types/workflow-node.types";
import { GenericNodeContainer } from "../GenericNodeContainer";
import { GenericNodeDescription } from "../GenericNodeDescription";
import { GenericNodePorts } from "../GenericNodePorts";
import { GenericNodeRightContent } from "../GenericNodeRightContent";
import { GenericNodeTitle } from "../GenericNodeTitle";

export const Task: FC<NodeProps<GraphNode<ENodeType.TASK>>> = ({ id }) => (
  <WorkflowNodeProvider id={id}>
    <GenericNodeContainer>
      <GenericNodeRightContent>
        <GenericNodeTitle />
        <GenericNodeDescription />
      </GenericNodeRightContent>
      <GenericNodePorts<ENodeType.TASK>
        getDisabled={({ port, hasEnabledPort }) =>
          port === ELinkType.TASK_OUT && hasEnabledPort
        }
      />
    </GenericNodeContainer>
  </WorkflowNodeProvider>
);
