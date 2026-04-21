/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionStatus } from "@hexabot-ai/agentic";
import * as Icons from "lucide-react";
import { createElement, type ComponentProps } from "react";

import type {
  WorkflowAction,
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

export const getWorkflowStateConfig = (
  status?: ActionStatus,
): WorkflowStateConfig | undefined => {
  switch (status) {
    case "running":
      return { icon: WorkflowRunningIcon, color: "#4dc4e6" };
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
}: WorkflowThemeInput): ResolvedWorkflowTheme => {
  const isDarkMode = mode === "dark";
  const stateConfig = getWorkflowStateConfig(status);
  const borderColor =
    stateConfig?.color ?? baseTheme?.borderColor ?? action?.color;
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
    iconColor: stateConfig?.color ?? baseTheme?.iconColor ?? borderColor,
    borderColor,
  };
};
