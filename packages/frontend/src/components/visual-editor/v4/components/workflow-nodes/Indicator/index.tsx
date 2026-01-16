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
import { GenericNodeLabel } from "../GenericNodeLabel";
import { GenericNodePorts } from "../GenericNodePorts";

export const Indicator: FC<NodeProps<NodeData<ENodeType.INDICATOR>>> = ({
  id,
}) => (
  <WorkflowNodeProvider id={id}>
    <GenericNodeContainer borderRadius="50%">
      <GenericNodeIcon />
    </GenericNodeContainer>
    <GenericNodePorts />
    <GenericNodeLabel />
  </WorkflowNodeProvider>
);
