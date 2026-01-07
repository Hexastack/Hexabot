/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { PropsWithChildren } from "react";

import { useWorkflowNode } from "../../../hooks/useWorkflowNode";
import { ENodeType } from "../../../types/workflow-node.types";

export const TaskContainer = ({ children }: PropsWithChildren) => {
  const { theme } = useWorkflowNode<ENodeType.TASK>();

  return (
    <div
      className="custom-node2"
      style={{
        border: `1px solid ${theme.bgColor}`,
        zIndex: 2,
      }}
    >
      {children}
    </div>
  );
};
