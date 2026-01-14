/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ErrorOutline } from "@mui/icons-material";
import { styled } from "@mui/material";

import { useWorkflowNode } from "../../hooks/useWorkflowNode";

export const GenericNodeIcon = () => {
  const { theme, height = 1, width = 1 } = useWorkflowNode();
  const IconComponent: React.ComponentType<any> =
    "Icon" in theme ? theme.Icon : ErrorOutline;
  const StyledIcon = styled(IconComponent)(() => ({
    fontSize: "100%",
  }));

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
      <StyledIcon />
    </div>
  );
};
