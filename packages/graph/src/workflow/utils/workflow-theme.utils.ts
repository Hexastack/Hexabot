/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { ActionStatus } from "@hexabot-ai/agentic";
import * as Icons from "lucide-react";
import { createElement, type ComponentProps } from "react";

import type {
  WorkflowAction,
  WorkflowIcon,
  WorkflowNodeTheme,
} from "../types/workflow-node.types";

type WorkflowStateConfig = {
  icon: WorkflowIcon;
  color?: string;
};

type WorkflowThemeInput = {
  baseTheme?: WorkflowNodeTheme;
  action?: WorkflowAction;
  status?: ActionStatus;
  mode?: "light" | "dark" | "system";
};

export type ResolvedWorkflowTheme = WorkflowNodeTheme & { Icon: WorkflowIcon };

const DEFAULT_NODE_TEXT_COLOR = "#51627a";
const DEFAULT_DARK_NODE_TEXT_COLOR = "#ffffff";
const DEFAULT_LIGHT_MIX_TARGET = "#ffffff";
const DEFAULT_DARK_MIX_TARGET = "#000000";
const appendClassName = (className: string | undefined, name: string) => {
  return className ? `${className} ${name}` : name;
};
const WorkflowRunningIcon: WorkflowIcon = ({
  className,
  ...props
}: ComponentProps<typeof Icons.LoaderCircle>) => {
  return createElement(Icons.LoaderCircle, {
    ...props,
    className: appendClassName(className, "workflow-icon-spin"),
  });
};
const WORKFLOW_STATE_ICONS: Partial<Record<ActionStatus, WorkflowIcon>> = {
  running: WorkflowRunningIcon,
  failed: Icons.TriangleAlert,
  suspended: Icons.SquarePause,
  cancelled: Icons.Ban,
};
const WORKFLOW_STATE_COLOR_OVERRIDES: Partial<Record<ActionStatus, string>> = {
  failed: "#FF0000",
  cancelled: "#64748B",
};

export const getWorkflowStateConfig = (
  status?: ActionStatus,
): WorkflowStateConfig | undefined => {
  if (!status) {
    return undefined;
  }

  const icon = WORKFLOW_STATE_ICONS[status];

  if (!icon) {
    return undefined;
  }

  const color = WORKFLOW_STATE_COLOR_OVERRIDES[status];

  return color ? { icon, color } : { icon };
};

export const resolveWorkflowStepTheme = ({
  baseTheme,
  action,
  status,
  mode,
}: WorkflowThemeInput): ResolvedWorkflowTheme => {
  const isDarkMode = mode === "dark";
  const stateConfig = getWorkflowStateConfig(status);
  const stateColorOverride = status
    ? WORKFLOW_STATE_COLOR_OVERRIDES[status]
    : undefined;
  const borderColor =
    stateColorOverride ?? baseTheme?.borderColor ?? action?.color;
  const iconName = baseTheme?.icon ?? action?.icon;
  const namedIcon =
    iconName && iconName in Icons
      ? (Icons[iconName as keyof typeof Icons] as WorkflowIcon)
      : undefined;
  const Icon = stateConfig?.icon ?? namedIcon ?? baseTheme?.Icon ?? Icons.Zap;

  return {
    Icon,
    color:
      baseTheme?.color ??
      (isDarkMode ? DEFAULT_DARK_NODE_TEXT_COLOR : DEFAULT_NODE_TEXT_COLOR),
    bgColor:
      baseTheme?.bgColor ??
      (borderColor
        ? `color-mix(in srgb, ${borderColor}, ${
            isDarkMode ? DEFAULT_DARK_MIX_TARGET : DEFAULT_LIGHT_MIX_TARGET
          } ${isDarkMode ? "85%" : "95%"})`
        : undefined),
    iconColor: stateColorOverride ?? baseTheme?.iconColor ?? borderColor,
    borderColor,
  };
};
