/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useWorkflowNode } from "../../../hooks/useWorkflowNode";
import { ENodeType } from "../../../types/workflow-node.types";
import { GenericHandle } from "../../handlers/GenericHandle";

export const GroupPorts = () => {
  const { ports } = useWorkflowNode<ENodeType.GROUP>();

  return ports?.map((port) => <GenericHandle key={port} id={port} />);
};
