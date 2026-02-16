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

import { useHasEnabledPort } from "./Task/hooks/useHasEnabledPort";

export const GenericNodePorts = <T extends ENodeType = ENodeType>({
  getDisabled,
}: {
  getDisabled?: (props: {
    port: Port<T>;
    idx: number;
    node: IWorkflowNodeContext<T>;
    hasEnabledPort: boolean;
  }) => boolean;
}) => {
  const workflowNode = useWorkflowNode<T>();
  const hasEnabledPort = useHasEnabledPort<T>();

  return (workflowNode.ports as Port<T>[])?.map((port, idx) => {
    const isDisabled = getDisabled?.({
      port,
      idx,
      node: workflowNode,
      hasEnabledPort,
    });

    if (isDisabled) {
      return null;
    }

    return <GenericHandle key={port} id={port} />;
  });
};
