/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useWorkflowNode } from "../../hooks/useWorkflowNode";
import { ENodeType } from "../../types/workflow-node.types";

export const GenericNodeDescription = <T extends ENodeType = ENodeType>() => {
  const workflowNode = useWorkflowNode<T>();

  if (!("description" in workflowNode)) {
    return null;
  }

  return (
    <div
      title={workflowNode.description}
      style={{
        color: "#444",
        fontSize: "14px",
        textAlign: "left",
        display: "flex",
        flex: "auto",
        marginTop: "8px",
      }}
    >
      {workflowNode.description}
    </div>
  );
};
