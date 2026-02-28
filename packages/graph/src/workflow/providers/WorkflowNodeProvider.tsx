/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useNodeConnections, useReactFlow } from "@xyflow/react";
import { type FC } from "react";

import { useWorkflowGraphHost } from "../contexts/workflow-graph-host.context";
import { WorkflowNodeContext } from "../contexts/workflow-node.context";
import type {
  GraphNode,
  IWorkflowNodeProps,
} from "../types/workflow-node.types";

export const WorkflowNodeProvider: FC<IWorkflowNodeProps> = ({
  id,
  children,
}) => {
  const { getNode } = useReactFlow();
  const node = getNode(id) as GraphNode | undefined;
  const connections = useNodeConnections({ id });
  const { actionCatalog, executionStates } = useWorkflowGraphHost();

  if (!node) {
    return null;
  }

  const { data, ...rest } = node;
  const nodeData = data as { actionName?: unknown };
  const actionName =
    typeof nodeData.actionName === "string"
      ? nodeData.actionName
      : undefined;
  const action = actionName ? actionCatalog.get(actionName) : undefined;
  const executionState = [...(executionStates[id] ?? [])]
    .sort((e1, e2) => (e1.t - e2.t > 0 ? 1 : -1))
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
