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
import { GenericNodeIcon } from "../GenericNodeIcon";
import { GenericNodePorts } from "../GenericNodePorts";
import { GenericNodeTitle } from "../GenericNodeTitle";

export const Operator: FC<NodeProps<NodeData<ENodeType.OPERATOR>>> = (
  operator,
) => (
  <WorkflowNodeProvider id={operator.id}>
    <GenericNodeContainer>
      <GenericNodeIcon />
      <GenericNodePorts<ENodeType.OPERATOR>
        getDisabled={(index, { groupName, level }) =>
          !!groupName && level === 0 && index === 0
        }
      />
    </GenericNodeContainer>
    <GenericNodeTitle />
  </WorkflowNodeProvider>
);
