/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { CircularProgress, styled } from "@mui/material";
import { ImageOff } from "lucide-react";

import { useWorkflowNode } from "../../hooks/useWorkflowNode";
import { ENodeType } from "../../types/workflow-node.types";

export const GenericNodeIcon = <T extends ENodeType = ENodeType>() => {
  const { theme, executionState = "N/A" } = useWorkflowNode<T>();
  const StyledIcon = styled(theme.Icon || ImageOff)(() => ({
    width: "20px",
    height: "20px",
  }));

  return (
    <div
      style={{
        color: theme.iconColor,
        boxOrient: "vertical",
        lineClamp: 2,
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: "flex",
        justifyContent: "center",
        paddingTop: "2px",
      }}
    >
      {executionState === "start" ? <CircularProgress /> : <StyledIcon />}
    </div>
  );
};
