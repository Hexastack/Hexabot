/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { NodeProps } from "@xyflow/react";
import type { FC } from "react";

import { WorkflowNodeProvider } from "../../../providers/WorkflowNodeProvider";
import {
  ENodeType,
  type GraphNode,
} from "../../../types/workflow-node.types";
import { GenericNodeContainer } from "../GenericNodeContainer";
import { GenericNodePorts } from "../GenericNodePorts";
import { GenericNodeRightContent } from "../GenericNodeRightContent";
import { GenericNodeTitle } from "../GenericNodeTitle";

export const BindingMulti: FC<NodeProps<GraphNode<ENodeType.BINDING_MULTI>>> = ({
  id,
}) => (
  <WorkflowNodeProvider id={id}>
    <GenericNodeContainer>
      <GenericNodeRightContent>
        <GenericNodeTitle />
      </GenericNodeRightContent>
      <GenericNodePorts />
    </GenericNodeContainer>
  </WorkflowNodeProvider>
);
