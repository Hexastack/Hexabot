/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useWorkflowNodeTheme } from "../../hooks/useWorkflowNodeTheme";
import { ENodeType } from "../../types/workflow-node.types";

export const GenericNodeIcon = <T extends ENodeType = ENodeType>() => {
  const { Icon, iconColor } = useWorkflowNodeTheme<T>();

  return (
    <div
      style={{
        color: iconColor,
        boxOrient: "vertical",
        lineClamp: 2,
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: "flex",
        justifyContent: "center",
        width: "20px",
        height: "20px",
        minWidth: "20px",
      }}
    >
      <Icon size="20px" />
    </div>
  );
};
