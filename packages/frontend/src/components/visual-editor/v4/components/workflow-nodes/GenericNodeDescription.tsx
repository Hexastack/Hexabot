/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useWorkflowNode } from "../../hooks/useWorkflowNode";
import { ENodeType } from "../../types/workflow-node.types";

export const GenericNodeDescription = <T extends ENodeType = ENodeType>() => {
  const { description } = useWorkflowNode<T>();

  return (
    <div
      title={description}
      style={{
        color: "#666f7a",
        fontSize: "0.75rem",
        textAlign: "left",
        display: "flex",
        flex: "auto",
        marginTop: "5px",
      }}
    >
      {description}
    </div>
  );
};
