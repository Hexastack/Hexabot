/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Grid from "@mui/material/Grid2";
import { PropsWithChildren } from "react";

import { useWorkflowNode } from "../../hooks/useWorkflowNode";
import { ENodeType } from "../../types/workflow-node.types";

export const GenericNodeContainer = <T extends ENodeType = ENodeType>({
  borderRadius = "14px",
  children,
}: PropsWithChildren & { borderRadius?: string }) => {
  const { executionState, theme, width, height } = useWorkflowNode<T>();

  return (
    <Grid
      container
      gap="14px"
      style={{
        position: "relative",
        width,
        height,
        textAlign: "center",
        borderRadius,
        outline: "none",
        pointerEvents: "none",
        border:
          executionState === "start"
            ? "2px solid green"
            : `2px solid ${theme.borderColor}`,
        backgroundColor: theme.bgColor,
        overflow: "hidden",
        boxShadow: "0 3px 6px #0002",
        padding: "1rem",
      }}
    >
      {children}
    </Grid>
  );
};
