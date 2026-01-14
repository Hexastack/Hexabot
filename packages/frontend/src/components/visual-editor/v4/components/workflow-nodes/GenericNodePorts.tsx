/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useWorkflowNode } from "../../hooks/useWorkflowNode";
import {
  ENodeType,
  IWorkflowNodeContext,
  Port,
} from "../../types/workflow-node.types";
import { GenericHandle } from "../handlers/GenericHandle";

export const GenericNodePorts = <T extends ENodeType = ENodeType>({
  getDisabled,
}: {
  getDisabled?: (idx: number, node: IWorkflowNodeContext<T>) => boolean;
}) => {
  const workflowNode = useWorkflowNode<T>();

  return (workflowNode.ports as Port<ENodeType>[])?.map((port, idx) => {
    const isDisabled = getDisabled?.(idx, workflowNode);

    if (isDisabled) {
      return null;
    }

    return <GenericHandle key={port} id={port} />;
  });
};
