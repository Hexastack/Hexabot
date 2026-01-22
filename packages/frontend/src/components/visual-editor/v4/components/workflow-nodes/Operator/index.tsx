/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { NodeProps } from "@xyflow/react";
import type { FC } from "react";

import { WorkflowNodeProvider } from "../../../providers/WorkflowNodeProvider";
import { ENodeType, type NodeData } from "../../../types/workflow-node.types";
import { GenericNodeContainer } from "../GenericNodeContainer";
import { GenericNodePorts } from "../GenericNodePorts";
import { GenericNodeTitle } from "../GenericNodeTitle";

export const Operator: FC<NodeProps<NodeData<ENodeType.OPERATOR>>> = ({
  id,
}) => (
  <WorkflowNodeProvider id={id}>
    <GenericNodeContainer>
      <GenericNodeTitle />
    </GenericNodeContainer>
    <GenericNodePorts<ENodeType.OPERATOR>
      getDisabled={({ idx, node }) =>
        !!node.groupName && node.level === 0 && idx === 0
      }
    />
  </WorkflowNodeProvider>
);
