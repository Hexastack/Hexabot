/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionStatus } from "@hexabot-ai/agentic";
import { CircularProgress, type Theme } from "@mui/material";
import * as Icons from "lucide-react";

import type { WorkflowAction ,
  WorkflowIcon,
  WorkflowNodeTheme,
} from "../types/workflow-node.types";

type WorkflowStateConfig = {
  icon: WorkflowIcon;
  color: string;
};

type WorkflowThemeInput = {
  baseTheme?: WorkflowNodeTheme;
  action?: WorkflowAction;
  status?: ActionStatus;
  mode?: "light" | "dark" | "system";
  theme?: Theme;
};

export type ResolvedWorkflowTheme = WorkflowNodeTheme & { Icon: WorkflowIcon };

export const getWorkflowStateConfig = (
  status?: ActionStatus,
): WorkflowStateConfig | undefined => {
  switch (status) {
    case "running":
      return { icon: CircularProgress, color: "#4dc4e6" };
    case "completed":
      return undefined;
    case "failed":
      return { icon: Icons.TriangleAlert, color: "#FF0000" };
    case "suspended":
      return { icon: Icons.SquarePause, color: "#4dc4e6" };
    default:
      return undefined;
  }
};

export const resolveWorkflowStepTheme = ({
  baseTheme,
  action,
  status,
  mode,
  theme,
}: WorkflowThemeInput): ResolvedWorkflowTheme => {
  const iconName = action?.icon;
  const apiIcon =
    iconName && iconName in Icons
      ? (Icons[iconName as keyof typeof Icons] as WorkflowIcon)
      : undefined;
  const isDarkMode = mode === "dark";
  const stateConfig = getWorkflowStateConfig(status);
  const uiColor = baseTheme?.borderColor;
  const apiColor = action?.color;
  const accentColor = stateConfig?.color || uiColor || apiColor;
  const uiIcon = baseTheme?.Icon;
  const Icon = stateConfig?.icon || uiIcon || apiIcon || Icons.Zap;

  return {
    Icon,
    color: baseTheme?.color || theme?.typography.caption.color,
    bgColor:
      baseTheme?.bgColor ||
      (accentColor
        ? `color-mix(in srgb, ${accentColor}, ${isDarkMode ? theme?.palette.common.black : theme?.palette.common.white} ${isDarkMode ? "85%" : "95%"})`
        : undefined),
    iconColor: accentColor || baseTheme?.iconColor,
    borderColor: accentColor || baseTheme?.borderColor,
  };
};
