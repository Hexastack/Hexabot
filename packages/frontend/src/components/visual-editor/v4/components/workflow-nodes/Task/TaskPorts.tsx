/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useWorkflowNode } from "../../../hooks/useWorkflowNode";
import { ELinkType, ENodeType } from "../../../types/workflow-node.types";
import { GenericHandle } from "../../handlers/GenericHandle";

import { useHasEnabledPort } from "./hooks/useHasEnabledPort";

export const TaskPorts = () => {
  const { ports } = useWorkflowNode<ENodeType.TASK>();
  const hasEnabledPort = useHasEnabledPort<ENodeType.TASK>();

  return ports?.map((port) => {
    if (port === ELinkType.TASK_OUT && hasEnabledPort) {
      return null;
    }

    return <GenericHandle key={port} id={port} />;
  });
};
