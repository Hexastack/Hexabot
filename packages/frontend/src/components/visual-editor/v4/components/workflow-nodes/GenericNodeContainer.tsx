/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Grid from "@mui/material/Grid";
import { PropsWithChildren } from "react";

import { useWorkflowNode } from "../../hooks/useWorkflowNode";
import { useWorkflowNodeTheme } from "../../hooks/useWorkflowNodeTheme";
import { ENodeType } from "../../types/workflow-node.types";

import { GenericNodeDeleteButton } from "./GenericNodeDeleteButton";

export const GenericNodeContainer = <T extends ENodeType = ENodeType>({
  children,
}: PropsWithChildren) => {
  const { width, height } = useWorkflowNode<T>();
  const { bgColor, borderColor } = useWorkflowNodeTheme<T>();

  return (
    <Grid
      sx={{
        position: "relative",
        width,
        height,
        borderRadius: "14px",
        outline: "none",
        pointerEvents: "none",
        border: `2px solid ${borderColor}`,
        backgroundColor: bgColor,
        boxShadow: "0 3px 6px #0002",
        padding: "1rem",
        transition: ".6s",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <GenericNodeDeleteButton />
      {children}
    </Grid>
  );
};
