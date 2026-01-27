/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { CircularProgress, styled } from "@mui/material";
import * as Icons from "lucide-react";
import { useState } from "react";

import { useSubscribe } from "@/websocket/socket-hooks";

import {
  EIndicatorType,
  ENodeType,
  type WorkflowNodeTheme,
} from "../types/workflow-node.types";
import {
  NodeExecutionState,
  SubscribeWorkflowProps,
} from "../types/workflow.types";

import { useWorkflowNode } from "./useWorkflowNode";

const ICON_STYLE = {
  width: "20px",
  height: "20px",
} as const;
const getStateConfig = (state?: NodeExecutionState) => {
  switch (state) {
    case "running":
    case "start":
      return { icon: CircularProgress, color: "#4dc4e6" };
    case "finish":
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
  const { theme, action, type, ...node } = useWorkflowNode<T>();
  const [currentState, setCurrentState] = useState<NodeExecutionState>("idle");
  const stateConfig = getStateConfig(currentState);
  const uiColor = theme.borderColor;
  const apiColor = action?.color;
  const color = stateConfig?.color || uiColor || apiColor;
  const uiIcon = theme.Icon;
  const apiIcon = Icons[action?.icon || ""];
  const Icon = stateConfig?.icon || uiIcon || apiIcon || Icons.Zap;
  const StyledIcon = styled(Icon)(() => ICON_STYLE);

  useSubscribe(
    "workflow",
    ({ workflowEvent, ...event }: SubscribeWorkflowProps) => {
      if (
        workflowEvent === "workflow:start" &&
        type === ENodeType.INDICATOR &&
        "indicator" in node &&
        node.indicator === EIndicatorType.WORKFLOW_START
      ) {
        setCurrentState("running");
        setTimeout(() => {
          setCurrentState("idle");
        }, 2000);
      } else if (
        workflowEvent === "step:start" &&
        "step" in event &&
        event.step?.id === node.stepId
      ) {
        setCurrentState("running");
        setTimeout(() => {
          setCurrentState("idle");
        }, 2000);
      }
    },
  );

  return {
    Icon: StyledIcon,
    color: theme.color || "#4a5565",
    bgColor: theme.bgColor || `color-mix(in srgb, ${color}, white 95%)`,
    iconColor: color || theme.iconColor,
    borderColor: color || theme.borderColor,
  } satisfies WorkflowNodeTheme;
};
