/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { NodeProps } from "@xyflow/react";
import type { FC } from "react";

import { WorkflowNodeProvider } from "@/components/visual-editor/v4/providers/WorkflowNodeProvider";
import {
  ENodeType,
  type NodeData,
} from "@/components/visual-editor/v4/types/workflow-node.types";

import { GenericNodeContainer } from "../../GenericNodeContainer";
import { GenericNodePorts } from "../../GenericNodePorts";
import { GenericNodeRightContent } from "../../GenericNodeRightContent";
import { GenericNodeTitle } from "../../GenericNodeTitle";

export const Model: FC<NodeProps<NodeData<ENodeType.MODEL>>> = ({
  id,
  data,
}) => (
  <WorkflowNodeProvider id={id} executionState={data.executionState}>
    <GenericNodeContainer>
      <GenericNodeRightContent>
        <GenericNodeTitle />
      </GenericNodeRightContent>
      <GenericNodePorts />
    </GenericNodeContainer>
  </WorkflowNodeProvider>
);
