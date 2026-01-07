/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Tooltip } from "@mui/material";

import { useWorkflowNode } from "../../../hooks/useWorkflowNode";
import { ENodeType } from "../../../types/workflow-node.types";

export const TaskHeader = () => {
  const { name, theme } = useWorkflowNode<ENodeType.TASK>();

  return (
    <div
      style={{
        color: theme.color,
        // backgroundImage: `linear-gradient(to top, ${color}ff, ${color}55)`,
      }}
      className="node-title"
    >
      <Tooltip sx={{ minHeight: "135px" }} arrow title={name} placement="top">
        <div
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </div>
      </Tooltip>
    </div>
  );
};
