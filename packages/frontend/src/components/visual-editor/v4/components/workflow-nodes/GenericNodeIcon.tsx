/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { styled } from "@mui/material";
import { Property } from "csstype";
import { ImageOff } from "lucide-react";

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
  const { theme } = useWorkflowNode();
  const IconComponent: React.ComponentType<any> =
    "Icon" in theme ? theme.Icon : ImageOff;
  const StyledIcon = styled(IconComponent)(() => ({
    width: "35px",
    height: "35px",
  }));
  const bgColor = "bgColor" in theme ? theme.bgColor : "#444";

  return (
    <div
      style={{
        color: bgColor,
        backgroundColor: hasBgColor ? `${bgColor}22` : "transparent",
        boxOrient: "vertical",
        lineClamp: 2,
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: "flex",
        justifyContent: "center",
        alignItems,
        maxWidth: "89px",
        minWidth,
      }}
    >
      <StyledIcon />
    </div>
  );
};
