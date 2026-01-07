/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useWorkflowNode } from "../../../hooks/useWorkflowNode";
import { ENodeType } from "../../../types/workflow-node.types";
import { GenericHandle } from "../../handlers/GenericHandle";

export const OperatorPorts = () => {
  const { ports, groupName, level } = useWorkflowNode<ENodeType.OPERATOR>();

  return ports?.map((port, index) => {
    if (groupName && level === 0 && index === 0) return null;

    return <GenericHandle key={port} id={port} />;
  });
};
