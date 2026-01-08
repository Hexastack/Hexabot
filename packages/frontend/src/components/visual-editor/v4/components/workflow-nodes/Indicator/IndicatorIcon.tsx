/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useWorkflowNode } from "../../../hooks/useWorkflowNode";
import { ENodeType } from "../../../types/workflow-node.types";

export const IndicatorIcon = () => {
  const { theme } = useWorkflowNode<ENodeType.INDICATOR>();

  return (
    <div
      style={{
        position: "relative",
        width: "90px",
        height: "90px",
        backgroundColor: `${theme.backgroundColor}33`,
        textAlign: "center",
        borderRadius: "50%",
        outline: "none",
        pointerEvents: "none",
        border: `1px solid ${theme.backgroundColor}cc`,
        boxShadow: "0 0 13px #0002 inset",
      }}
    >
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
    </div>
  );
};
