/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { CircularProgress, styled } from "@mui/material";
import * as Icons from "lucide-react";
import { Zap } from "lucide-react";

import {
  ENodeType,
  type WorkflowNodeTheme,
} from "../types/workflow-node.types";

import { useWorkflowNode } from "./useWorkflowNode";

const ICON_STYLE = {
  width: "20px",
  height: "20px",
} as const;
const LOADING_COLOR = "green" as const;
const Loading_ICON = CircularProgress;

export const useWorkflowNodeTheme = <T extends ENodeType = ENodeType>() => {
  const { theme, action, executionState } = useWorkflowNode<T>();
  const isLoading = executionState === "start";
  const uiColor = theme.borderColor;
  const apiColor = action?.color;
  const color = isLoading ? LOADING_COLOR : uiColor || apiColor;
  const uiIcon = theme.Icon;
  const apiIcon = Icons[action?.icon || ""];
  const Icon = uiIcon || apiIcon || Zap;
  const StyledIcon = styled(isLoading ? Loading_ICON : Icon)(() => ICON_STYLE);

  return {
    ...theme,
    Icon: StyledIcon,
    color: theme.color || "#4a5565",
    bgColor: theme.bgColor || `color-mix(in srgb, ${color}, white 95%)`,
    iconColor: color || theme.iconColor,
    borderColor: color || theme.borderColor,
  } satisfies WorkflowNodeTheme;
};
