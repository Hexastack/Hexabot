/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionStatus } from "@hexabot-ai/agentic";
import { CircularProgress, styled } from "@mui/material";
import * as Icons from "lucide-react";
import { useState } from "react";

import { useSubscribe } from "@/websocket/socket-hooks";

import {
  EIndicatorType,
  ENodeType,
  type WorkflowNodeTheme,
} from "../types/workflow-node.types";
import { SubscribeWorkflowProps } from "../types/workflow.types";

import { useWorkflow } from "./useWorkflow";
import { useWorkflowNode } from "./useWorkflowNode";

const ICON_STYLE = {
  width: "20px",
  height: "20px",
} as const;
const getStateConfig = (state?: ActionStatus) => {
  switch (state) {
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

export const useWorkflowNodeTheme = <T extends ENodeType = ENodeType>() => {
  const { selectedFlowId } = useWorkflow();
  const { theme, action, type, ...node } = useWorkflowNode<T>();
  const [nodeState, setNodeState] = useState<
    | {
        state: ActionStatus;
        t: number;
      }
    | undefined
  >();
  const stateConfig = getStateConfig(nodeState?.state);
  const uiColor = theme.borderColor;
  const apiColor = action?.color;
  const color = stateConfig?.color || uiColor || apiColor;
  const uiIcon = theme.Icon;
  const apiIcon = Icons[action?.icon || ""];
  const Icon = stateConfig?.icon || uiIcon || apiIcon || Icons.Zap;
  const StyledIcon = styled(Icon)(() => ICON_STYLE);

  useSubscribe(
    "workflow",
    ({ workflowEvent, workflowId, ...event }: SubscribeWorkflowProps) => {
      if (workflowId !== selectedFlowId) {
        return;
      }
      if (workflowEvent === "workflow:failure") {
        setNodeState(undefined);
      } else if (type === ENodeType.INDICATOR && "indicator" in node) {
        if (
          workflowEvent === "workflow:start" &&
          node.indicator === EIndicatorType.WORKFLOW_START
        ) {
          setNodeState({ state: "running", t: event.t });
          setTimeout(() => {
            setNodeState(undefined);
          }, 400);
        } else if (
          workflowEvent === "workflow:finish" &&
          node.indicator === EIndicatorType.WORKFLOW_END
        ) {
          setNodeState({ state: "running", t: event.t });

          setTimeout(() => {
            setNodeState(undefined);
          }, 1200);
        }
      } else if ("step" in event && event.step?.id === node.stepId) {
        switch (workflowEvent) {
          case "step:suspended":
            setNodeState({ state: "suspended", t: event.t });
            break;
          case "step:start":
            setNodeState((old) => ({
              ...(old?.state === "suspended" || (old?.t && old?.t >= event.t)
                ? old
                : { state: "running", t: event.t }),
            }));
            break;
          case "step:success":
            setTimeout(() => {
              setNodeState(undefined);
            }, 800);
            break;
          case "step:error":
            setTimeout(() => {
              setNodeState({ state: "failed", t: 0 });
            }, 800);
            break;
        }
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
