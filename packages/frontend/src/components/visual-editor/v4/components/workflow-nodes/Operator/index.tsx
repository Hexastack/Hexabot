/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { NodeProps } from "@xyflow/react";
import type { FC } from "react";

import { WorkflowNodeProvider } from "../../../providers/WorkflowNodeProvider";
import { ENodeType, type NodeData } from "../../../types/workflow-node.types";

import { OperatorContainer } from "./OperatorContainer";
import { OperatorIcon } from "./OperatorIcon";
import { OperatorPorts } from "./OperatorPorts";
import { OperatorTitle } from "./OperatorTitle";

export const Operator: FC<NodeProps<NodeData<ENodeType.OPERATOR>>> = (
  operator,
) => (
  <WorkflowNodeProvider id={operator.id}>
    <OperatorContainer>
      <OperatorIcon />
      <OperatorPorts />
    </OperatorContainer>
    <OperatorTitle />
  </WorkflowNodeProvider>
);
