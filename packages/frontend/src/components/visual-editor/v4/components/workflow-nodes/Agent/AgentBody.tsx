/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useWorkflowNode } from "../../../hooks/useWorkflowNode";
import { ENodeType } from "../../../types/workflow-node.types";

export const AgentBody = () => {
  const { description } = useWorkflowNode<ENodeType.AGENT>();

  return (
    <div
      title={description}
      style={{
        color: "#444",
        margin: "40px 0px",
        fontSize: "14px",
        display: "box",
        boxOrient: "vertical",
        lineClamp: 2,
        overflow: "hidden",
        textOverflow: "ellipsis",
        height: "60px",
        alignContent: "center",
      }}
    >
      {description}
    </div>
  );
};
