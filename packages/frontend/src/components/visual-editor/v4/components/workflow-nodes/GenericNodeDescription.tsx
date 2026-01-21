/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Typography } from "@mui/material";

import { useWorkflowNode } from "../../hooks/useWorkflowNode";
import { ENodeType } from "../../types/workflow-node.types";

export const GenericNodeDescription = <T extends ENodeType = ENodeType>() => {
  const { description } = useWorkflowNode<T>();

  return (
    <Typography noWrap sx={{ fontSize: "0.75rem", color: "#666f7a" }}>
      {description}
    </Typography>
  );
};
