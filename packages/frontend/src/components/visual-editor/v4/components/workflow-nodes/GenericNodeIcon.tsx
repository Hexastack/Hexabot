/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ErrorOutline } from "@mui/icons-material";
import { styled } from "@mui/material";
import { Property } from "csstype";

import { useWorkflowNode } from "../../hooks/useWorkflowNode";

export const GenericNodeIcon = ({
  hasBgColor = false,
  minWidth = "89px",
  alignItems = "center",
}: {
  hasBgColor?: boolean;
  minWidth?: string;
  alignItems?: Property.AlignItems;
}) => {
  const workflowNode = useWorkflowNode();
  const { theme, height = 1, width = 1 } = workflowNode;
  const IconComponent: React.ComponentType<any> =
    "Icon" in theme ? theme.Icon : ErrorOutline;
  const StyledIcon = styled(IconComponent)(() => ({
    fontSize: "100%",
  }));
  const bgColor = "bgColor" in theme ? theme.bgColor : "#444";

  return (
    <div
      style={{
        color: bgColor,
        backgroundColor: hasBgColor ? `${bgColor}22` : "transparent",
        fontSize: Math.min(height, width) / 2,
        boxOrient: "vertical",
        lineClamp: 2,
        overflow: "hidden",
        textOverflow: "ellipsis",
        alignContent: "center",
        display: "flex",
        height,
        justifyContent: "center",
        alignItems,
        minWidth,
      }}
    >
      <StyledIcon />
    </div>
  );
};
