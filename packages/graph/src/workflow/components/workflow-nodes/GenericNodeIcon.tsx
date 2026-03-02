/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { CSSProperties } from "react";

import { useWorkflowNodeTheme } from "../../hooks/useWorkflowNodeTheme";
import { ENodeType } from "../../types/workflow-node.types";

export const GenericNodeIcon = <T extends ENodeType = ENodeType>() => {
  const { Icon, iconColor } = useWorkflowNodeTheme<T>();

  return (
    <div
      className="workflow-node-icon"
      style={{ "--workflow-node-icon-color": iconColor } as CSSProperties}
    >
      <Icon size="20px" />
    </div>
  );
};
