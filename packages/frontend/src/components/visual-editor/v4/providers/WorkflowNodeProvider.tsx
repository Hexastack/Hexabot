/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useNodeConnections, useReactFlow } from "@xyflow/react";
import { type FC, useMemo } from "react";

import { useWorkflowActionsCatalog } from "@/contexts/workflow-actions.context";

import { WorkflowNodeContext } from "../contexts/workflow-node.context";
import { useWorkflow } from "../hooks/useWorkflow";
import type {
  GraphNode,
  IWorkflowNodeProps,
} from "../types/workflow-node.types";

export const WorkflowNodeProvider: FC<IWorkflowNodeProps> = ({
  id,
  children,
}) => {
  const { getNode } = useReactFlow();
  const { data, ...rest } = useMemo(() => getNode(id) as GraphNode, [id]);
  const connections = useNodeConnections({ id });
  const { actionsByName } = useWorkflowActionsCatalog();
  const { executionStates } = useWorkflow();
  const action = actionsByName.get(data["actionName"]);
  const executionState = executionStates[id]
    ?.sort((e1, e2) => (e1.t - e2.t > 0 ? 1 : -1))
    .at(-1)?.state;

  return (
    <WorkflowNodeContext.Provider
      value={{
        ...data,
        ...rest,
        action,
        connections,
        executionState,
      }}
    >
      {children}
    </WorkflowNodeContext.Provider>
  );
};
