/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Tooltip } from "@mui/material";

import { useWorkflowNode } from "../../hooks/useWorkflowNode";
import { ENodeType } from "../../types/workflow-node.types";

export const GenericNodeTitle = <T extends ENodeType = ENodeType>() => {
  const workflowNode = useWorkflowNode<T>();

  if (!("title" in workflowNode)) {
    return null;
  }

  return (
    <div
      style={{
        color: workflowNode.theme.color,
        display: "flex",
        fontWeight: "bolder",
        fontSize: "14px",
        flex: "1",
      }}
      className="node-title-off"
    >
      <Tooltip
        sx={{ minHeight: "135px" }}
        arrow
        title={workflowNode.title}
        placement="top"
      >
        <div
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginTop: "10px",
            fontSize: "22px",
            zIndex: 4,
          }}
        >
          {workflowNode.title}
        </div>
      </Tooltip>
    </div>
  );
};
