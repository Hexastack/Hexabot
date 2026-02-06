/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionStatus } from "@hexabot-ai/agentic";
import { CircularProgress } from "@mui/material";
import * as Icons from "lucide-react";

import type { IAction } from "@/types/action.types";

import type {
  WorkflowIcon,
  WorkflowNodeTheme,
} from "../types/workflow-node.types";

type WorkflowStateConfig = {
  icon: WorkflowIcon;
  color: string;
};

type WorkflowThemeInput = {
  baseTheme?: WorkflowNodeTheme;
  action?: IAction;
  status?: ActionStatus;
};

export type ResolvedWorkflowTheme = WorkflowNodeTheme & { Icon: WorkflowIcon };

const DEFAULT_TEXT_COLOR = "#4a5565";

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
}: WorkflowThemeInput): ResolvedWorkflowTheme => {
  const stateConfig = getWorkflowStateConfig(status);
  const uiColor = baseTheme?.borderColor;
  const apiColor = action?.color;
  const accentColor = stateConfig?.color || uiColor || apiColor;
  const uiIcon = baseTheme?.Icon;
  const apiIcon = action?.icon ? Icons[action.icon] : undefined;
  const Icon = stateConfig?.icon || uiIcon || apiIcon || Icons.Zap;

  return {
    Icon,
    color: baseTheme?.color || DEFAULT_TEXT_COLOR,
    bgColor:
      baseTheme?.bgColor ||
      (accentColor
        ? `color-mix(in srgb, ${accentColor}, white 95%)`
        : undefined),
    iconColor: accentColor || baseTheme?.iconColor,
    borderColor: accentColor || baseTheme?.borderColor,
  };
};
