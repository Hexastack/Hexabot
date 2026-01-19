/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { CircularProgress, styled } from "@mui/material";
import { ImageOff } from "lucide-react";

import { ENodeType, WorkflowNodeTheme } from "../types/workflow-node.types";

import { useWorkflow } from "./useWorkflow";
import { useWorkflowNode } from "./useWorkflowNode";

const ICON_STYLE = {
  width: "20px",
  height: "20px",
} as const;
const LOADING_COLOR = "green" as const;
const Loading_ICON = CircularProgress;

export const useWorkflowNodeTheme = <T extends ENodeType = ENodeType>() => {
  const { theme, executionState, ...rest } = useWorkflowNode<T>();
  const { getActionColor } = useWorkflow();
  const mainColor =
    executionState === "start"
      ? LOADING_COLOR
      : ("action" in rest &&
          typeof rest.action === "string" &&
          getActionColor(rest.action)) ||
        theme.borderColor;
  const StyledIcon = styled(
    executionState === "start" ? Loading_ICON : theme.Icon || ImageOff,
  )(() => ICON_STYLE);

  return {
    ...theme,
    Icon: StyledIcon,
    color: theme.color || "#4a5565",
    bgColor: theme.bgColor || `color-mix(in srgb, ${mainColor}, white 95%)`,
    iconColor: mainColor || theme.iconColor,
    borderColor: mainColor || theme.borderColor,
  } satisfies WorkflowNodeTheme;
};
