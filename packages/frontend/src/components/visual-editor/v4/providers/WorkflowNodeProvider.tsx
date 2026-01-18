/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useNodeConnections, useReactFlow } from "@xyflow/react";
import { type FC, useMemo } from "react";

import { WorkflowNodeContext } from "../contexts/workflow-node.context";
import { useWorkflow } from "../hooks/useWorkflow";
import type {
  IWorkflowNodeProps,
  NodeData,
} from "../types/workflow-node.types";

export const WorkflowNodeProvider: FC<IWorkflowNodeProps> = ({
  id,
  children,
}) => {
  const { getNode } = useReactFlow();
  const { data, ...rest } = useMemo(() => getNode(id) as NodeData, [id]);
  const connections = useNodeConnections({ id });
  const { executionStates } = useWorkflow();
  const executionState = executionStates[id]?.state;

  return (
    <WorkflowNodeContext.Provider
      value={{ ...data, ...rest, connections, executionState }}
    >
      {children}
    </WorkflowNodeContext.Provider>
  );
};
