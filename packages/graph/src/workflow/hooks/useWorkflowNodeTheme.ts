/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionStatus } from "@hexabot-ai/agentic";
import { styled, useColorScheme, useTheme } from "@mui/material/styles";

import {
  ENodeType,
  type NodeExecutionState,
  type WorkflowNodeTheme,
} from "../types/workflow-node.types";
import { resolveWorkflowStepTheme } from "../utils/workflow-theme.utils";

import { useWorkflowNode } from "./useWorkflowNode";

const ICON_STYLE = {
  width: "20px",
  height: "20px",
} as const;
const toActionStatus = (
  executionState?: NodeExecutionState,
): ActionStatus | undefined => {
  switch (executionState) {
    case "running":
    case "start":
      return "running";
    case "suspended":
      return "suspended";
    case "error":
      return "failed";
    case "finish":
      return "completed";
    default:
      return undefined;
  }
};

export const useWorkflowNodeTheme = <T extends ENodeType = ENodeType>() => {
  const muiTheme = useTheme();
  const { mode } = useColorScheme();
  const { theme: baseTheme, action, executionState } = useWorkflowNode<T>();
  const resolvedTheme = resolveWorkflowStepTheme({
    baseTheme,
    action,
    status: toActionStatus(executionState),
    mode,
    theme: muiTheme,
  });
  const StyledIcon = styled(resolvedTheme.Icon)(() => ICON_STYLE);

  return {
    ...resolvedTheme,
    Icon: StyledIcon,
  } satisfies WorkflowNodeTheme;
};
