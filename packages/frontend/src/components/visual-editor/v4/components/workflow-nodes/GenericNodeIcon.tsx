/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { AlertCircle } from "lucide-react";

import { useWorkflowNode } from "../../hooks/useWorkflowNode";
import type { WorkflowIcon } from "../../types/workflow-node.types";

export const GenericNodeIcon = () => {
  const { theme, height = 1, width = 1 } = useWorkflowNode();
  const IconComponent: WorkflowIcon =
    "Icon" in theme ? theme.Icon : AlertCircle;

  return (
    <div
      style={{
        color: "bgColor" in theme ? theme.bgColor : "#444",
        fontSize: Math.min(height, width) / 2,
        boxOrient: "vertical",
        lineClamp: 2,
        overflow: "hidden",
        textOverflow: "ellipsis",
        alignContent: "center",
        display: "flex",
        height,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <IconComponent width="1em" height="1em" />
    </div>
  );
};
