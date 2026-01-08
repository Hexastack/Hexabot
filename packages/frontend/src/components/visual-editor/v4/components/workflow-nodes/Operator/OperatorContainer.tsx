/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { PropsWithChildren } from "react";

import { useWorkflowNode } from "../../../hooks/useWorkflowNode";
import { ENodeType } from "../../../types/workflow-node.types";

export const OperatorContainer = ({ children }: PropsWithChildren) => {
  const { theme } = useWorkflowNode<ENodeType.OPERATOR>();

  return (
    <div
      style={{
        position: "relative",
        top: "-6px",
        width: "90px",
        height: "90px",
        backgroundColor: `${theme.backgroundColor}33`,
        textAlign: "center",
        borderRadius: "20%",
        outline: "none",
        pointerEvents: "none",
        border: `1px solid ${theme.backgroundColor}cc`,
        boxShadow: "0 0 13px #0002 inset",
      }}
    >
      {children}
    </div>
  );
};
