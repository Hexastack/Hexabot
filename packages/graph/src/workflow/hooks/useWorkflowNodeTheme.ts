/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionStatus } from "@hexabot-ai/agentic";

import { useWorkflowGraphHost } from "../contexts/workflow-graph-host.context";
import {
  ENodeType,
  type NodeExecutionState,
} from "../types/workflow-node.types";
import { resolveWorkflowStepTheme } from "../utils/workflow-theme.utils";

import { useWorkflowNode } from "./useWorkflowNode";

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
  const { colorMode } = useWorkflowGraphHost();
  const { theme: baseTheme, action, executionState } = useWorkflowNode<T>();

  return resolveWorkflowStepTheme({
    baseTheme,
    action,
    status: toActionStatus(executionState),
    mode: colorMode,
  });
};
