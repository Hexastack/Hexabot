/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useWorkflowNode } from "../../hooks/useWorkflowNode";
import {
  ENodeType,
  getWorkflowPortId,
  IWorkflowNodeContext,
  Port,
  WorkflowNodePort,
} from "../../types/workflow-node.types";
import { GenericHandle } from "../handles/GenericHandle";

export const GenericNodePorts = <T extends ENodeType = ENodeType>({
  getDisabled,
}: {
  getDisabled?: (props: {
    port: Port<T>;
    portDef: WorkflowNodePort<T>;
    idx: number;
    node: IWorkflowNodeContext<T>;
  }) => boolean;
}) => {
  const workflowNode = useWorkflowNode<T>();

  return (workflowNode.ports as WorkflowNodePort<T>[])?.map((portDef, idx) => {
    const port = getWorkflowPortId(portDef);
    const isHidden = getDisabled?.({
      port,
      portDef,
      idx,
      node: workflowNode,
    });
    const label = typeof portDef === "string" ? undefined : portDef.label;

    return (
      <GenericHandle key={port} id={port} label={label} hidden={isHidden} />
    );
  });
};
