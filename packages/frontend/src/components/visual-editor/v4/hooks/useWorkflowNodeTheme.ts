/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { CircularProgress, styled } from "@mui/material";
import * as Icons from "lucide-react";

import { NodeState } from "../components/workflow-nodes/GenericNodeContainer";
import {
  ENodeType,
  type WorkflowNodeTheme,
} from "../types/workflow-node.types";

import { useWorkflowNode } from "./useWorkflowNode";

const ICON_STYLE = {
  width: "20px",
  height: "20px",
} as const;
const getStateConfig = (state?: NodeState) => {
  switch (state) {
    case "loading":
      return { icon: CircularProgress, color: "#4dc4e6" };
    case "success":
      return undefined;
    case "error":
      return { icon: Icons.TriangleAlert, color: "#FF0000" };
    case "suspended":
      return { icon: Icons.SquarePause, color: "#4dc4e6" };
    default:
      return undefined;
  }
};

export const useWorkflowNodeTheme = <T extends ENodeType = ENodeType>() => {
  const { theme, action, executionState } = useWorkflowNode<T>();
  const stateConfig = getStateConfig(executionState);
  const uiColor = theme?.borderColor;
  const apiColor = action?.color;
  const color = stateConfig?.color || uiColor || apiColor;
  const uiIcon = theme?.Icon;
  const apiIcon = Icons[action?.icon || ""];
  const Icon = stateConfig?.icon || uiIcon || apiIcon || Icons.Zap;
  const StyledIcon = styled(Icon)(() => ICON_STYLE);

  return {
    Icon: StyledIcon,
    color: theme?.color || "#4a5565",
    bgColor: theme?.bgColor || `color-mix(in srgb, ${color}, white 95%)`,
    iconColor: color || theme?.iconColor,
    borderColor: color || theme?.borderColor,
  } satisfies WorkflowNodeTheme;
};
