/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionStatus } from "@hexabot-ai/agentic";
import { styled, useColorScheme } from "@mui/material";
import { useState } from "react";

import { theme } from "@/layout/theme";
import { useSubscribe } from "@/websocket/socket-hooks";

import {
  EIndicatorType,
  ENodeType,
  type WorkflowNodeTheme,
} from "../types/workflow-node.types";
import { SubscribeWorkflowProps } from "../types/workflow.types";
import { resolveWorkflowStepTheme } from "../utils/workflow-theme.utils";

import { useWorkflow } from "./useWorkflow";
import { useWorkflowNode } from "./useWorkflowNode";

const ICON_STYLE = {
  width: "20px",
  height: "20px",
} as const;

export const useWorkflowNodeTheme = <T extends ENodeType = ENodeType>() => {
  const { selectedFlowId } = useWorkflow();
  const { theme: baseTheme, action, type, ...node } = useWorkflowNode<T>();
  const [nodeState, setNodeState] = useState<
    | {
        state: ActionStatus;
        t: number;
      }
    | undefined
  >();
  const { mode } = useColorScheme();
  const resolvedTheme = resolveWorkflowStepTheme({
    baseTheme,
    action,
    status: nodeState?.state,
    mode,
    theme,
  });
  const StyledIcon = styled(resolvedTheme.Icon)(() => ICON_STYLE);

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
    ...resolvedTheme,
    Icon: StyledIcon,
  } satisfies WorkflowNodeTheme;
};
