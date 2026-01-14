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
import { GenericNodeIcon } from "../../GenericNodeIcon";
import { GenericNodePorts } from "../../GenericNodePorts";
import { GenericNodeTitle } from "../../GenericNodeTitle";

export const Tool: FC<NodeProps<NodeData<ENodeType.TOOL>>> = ({ id }) => (
  <WorkflowNodeProvider id={id}>
    <GenericNodeContainer>
      <GenericNodeIcon />
      <GenericNodePorts />
    </GenericNodeContainer>
    <GenericNodeTitle />
  </WorkflowNodeProvider>
);
