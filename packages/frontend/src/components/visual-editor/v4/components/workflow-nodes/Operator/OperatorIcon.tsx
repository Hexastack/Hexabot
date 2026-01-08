/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useWorkflowNode } from "../../../hooks/useWorkflowNode";
import { ENodeType } from "../../../types/workflow-node.types";

export const OperatorIcon = () => {
  const { theme } = useWorkflowNode<ENodeType.OPERATOR>();

  return (
    <theme.Icon
      style={{
        color: theme.backgroundColor,
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: "50px",
        filter: "drop-shadow(0 0 1px #444)",
      }}
    />
  );
};
