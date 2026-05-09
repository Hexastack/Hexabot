/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { NodeProps } from "@xyflow/react";
import type { FC } from "react";

import { WorkflowNodeProvider } from "../../../providers/WorkflowNodeProvider";
import { ENodeType, type GraphNode } from "../../../types/workflow-node.types";
import { GenericNodeContainer } from "../GenericNodeContainer";
import { GenericNodePorts } from "../GenericNodePorts";
import { GenericNodeRightContent } from "../GenericNodeRightContent";
import { GenericNodeTitle } from "../GenericNodeTitle";

export const Indicator: FC<NodeProps<GraphNode<ENodeType.INDICATOR>>> = (
  props,
) => (
  <WorkflowNodeProvider node={props}>
    <GenericNodeContainer>
      <GenericNodeRightContent variant="title-only">
        <GenericNodeTitle />
      </GenericNodeRightContent>
      <GenericNodePorts />
    </GenericNodeContainer>
  </WorkflowNodeProvider>
);
