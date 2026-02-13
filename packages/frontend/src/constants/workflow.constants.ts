/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { StepType } from "@hexabot-ai/agentic";
import { MarkerType, type Node } from "@xyflow/react";
import {
  Bot,
  Brain,
  Check,
  CircleStop,
  Clock,
  Database,
  Hand,
  MessagesSquare,
  Pause,
  Play,
  Plus,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { TTranslationKeys } from "@/i18n/i18n.types";
import { theme } from "@/layout/theme";
import { EWorkflowRunStatus } from "@/types/workflow-run.types";
import { WorkflowType } from "@/types/workfow.types";

import type { FlowTypeInfo } from "../components/visual-editor/v4/components/main/FlowsDrawer/types";
import {
  WORKFLOW_OPERATOR_GRAPH_THEME,
  WORKFLOW_STEP_GRAPH_THEME,
} from "../components/visual-editor/v4/constants/workflow-graph-theme.constants";
import {
  EEdgeType,
  EIndicatorType,
  ELinkType,
  ENodeType,
  type INodeConfig,
} from "../components/visual-editor/v4/types/workflow-node.types";
import {
  getGroupId,
  getTaskAction,
  getTaskDescription,
} from "../components/visual-editor/v4/utils/graph.utils";

export const DEFAULT_NODE_PROPS = {
  draggable: false,
  focusable: false,
  selectable: false,
} satisfies Omit<Node, "id" | "data" | "position">;

export const DIMENSIONS = {
  [ENodeType.MODEL]: { width: 180, height: 55 },
  [ENodeType.TOOL]: { width: 180, height: 55 },
  [ENodeType.AGENT]: { width: 256, height: 75 },
  [ENodeType.INDICATOR]: { width: 100, height: 56 },
  [ENodeType.TASK]: { width: 256, height: 75 },
  [ENodeType.OPERATOR]: { width: 150, height: 55 },
  [ENodeType.MEMORY]: { width: 256, height: 75 },
  [ENodeType.BRANCH_PLACEHOLDER]: { width: 256, height: 84 },
} satisfies INodeConfig["dimensions"];
export const HIGHLIGHTS = {
  [StepType.Loop]: { color: "#fefbe8", padding: 32 },
  [StepType.Parallel]: { color: "#fefbe8", padding: 32 },
  [StepType.Conditional]: { color: "#fefbe8", padding: 32 },
} satisfies INodeConfig["highlights"];
export const EDGES = {
  [EEdgeType.EDGE_WITH_BUTTON]: {
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#777",
      strokeWidth: 2,
    },
    style: { stroke: "#777", strokeWidth: "2px" },
  },
} satisfies INodeConfig["edges"];
export const NODES = {
  [ENodeType.MEMORY]: {
    theme: {
      Icon: Database,
      borderColor: "#7bb0ff",
    },
    ports: [ELinkType.MEMORY_IN],
    title: "",
  },
  [ENodeType.AGENT]: {
    memory: "",
    model: "",
    tools: [],
    ports: [
      ELinkType.AGENT_IN,
      ELinkType.AGENT_OUT,
      ELinkType.AGENT_TOOL,
      ELinkType.AGENT_MODEL,
      ELinkType.AGENT_MEMORY,
    ],
    theme: {
      Icon: Bot,
      borderColor: "#7bb0ff",
    },
    title: "",
  },
  [ENodeType.TOOL]: {
    title: "",
    ports: [ELinkType.TOOL_IN],
    theme: {
      Icon: Zap,
      borderColor: "orange",
    },
  },
  [ENodeType.MODEL]: {
    title: "",
    ports: [ELinkType.MODEL_IN],
    theme: {
      Icon: Brain,
      borderColor: "#ad46fc",
    },
  },
  [ENodeType.INDICATOR]: {
    [EIndicatorType.WORKFLOW_START]: {
      theme: {
        Icon: Play,
        borderColor: "#37b765",
      },
      ports: [ELinkType.INDICATOR_OUT],
      i18nTitle: "message.start",
    },
    [EIndicatorType.WORKFLOW_END]: {
      theme: {
        Icon: CircleStop,
        borderColor: "#e95d32",
      },
      ports: [ELinkType.INDICATOR_IN],
      i18nTitle: "message.stop",
    },
  },
  [ENodeType.OPERATOR]: {
    [StepType.Parallel]: {
      operatorType: StepType.Parallel,
      theme: WORKFLOW_OPERATOR_GRAPH_THEME[StepType.Parallel].nodeTheme,
      i18nTitle: WORKFLOW_OPERATOR_GRAPH_THEME[StepType.Parallel].i18nTitle,
      ports: [ELinkType.OPERATOR_IN, ELinkType.OPERATOR_OUT],
    },
    [StepType.Conditional]: {
      operatorType: StepType.Conditional,
      theme: WORKFLOW_OPERATOR_GRAPH_THEME[StepType.Conditional].nodeTheme,
      i18nTitle: WORKFLOW_OPERATOR_GRAPH_THEME[StepType.Conditional].i18nTitle,
      ports: [ELinkType.OPERATOR_IN, ELinkType.OPERATOR_OUT],
    },
    [StepType.Loop]: {
      operatorType: StepType.Loop,
      theme: WORKFLOW_OPERATOR_GRAPH_THEME[StepType.Loop].nodeTheme,
      i18nTitle: WORKFLOW_OPERATOR_GRAPH_THEME[StepType.Loop].i18nTitle,
      ports: [ELinkType.OPERATOR_IN, ELinkType.OPERATOR_OUT],
    },
  },
  [ENodeType.TASK]: (id, taskName, tasks) => {
    const groupName = getGroupId(id, HIGHLIGHTS);

    return {
      title: taskName,
      actionName: getTaskAction(taskName, tasks),
      description: getTaskDescription(taskName, tasks),
      ports: [ELinkType.TASK_IN, ELinkType.TASK_OUT],
      theme: {},
      groupName,
    };
  },
  [ENodeType.GROUP]: {
    ports: [ELinkType.GROUP_IN, ELinkType.GROUP_OUT],
    theme: {
      bgColor: "#7bb0ff",
    },
  },
  [ENodeType.BRANCH_PLACEHOLDER]: {
    i18nTitle: "button.add",
    ports: [ELinkType.BRANCH_PLACEHOLDER_IN, ELinkType.BRANCH_PLACEHOLDER_OUT],
    theme: {
      Icon: Plus,
      borderColor: "#7f8ea3",
    },
  },
} satisfies INodeConfig["nodes"];

export const WORKFLOW_STATUS: Record<
  EWorkflowRunStatus,
  Omit<FlowTypeInfo, "labelKey">
> = {
  [EWorkflowRunStatus.FAILED]: {
    key: WorkflowType.conversational,
    icon: X,
    color: theme.palette.error.main,
  },
  [EWorkflowRunStatus.FINISHED]: {
    key: WorkflowType.conversational,
    icon: Check,
    color: theme.palette.success.main,
  },
  [EWorkflowRunStatus.IDLE]: {
    key: WorkflowType.conversational,
    icon: WORKFLOW_STEP_GRAPH_THEME.Icon,
    color: WORKFLOW_STEP_GRAPH_THEME.color,
  },
  [EWorkflowRunStatus.RUNNING]: {
    key: WorkflowType.conversational,
    icon: Play,
    color: theme.palette.success.main,
  },
  [EWorkflowRunStatus.SUSPENDED]: {
    key: WorkflowType.conversational,
    icon: Pause,
    color: theme.palette.warning.main,
  },
};

type WorkflowTypeInfo = {
  key: WorkflowType;
  labelKey: TTranslationKeys;
  icon: LucideIcon;
  color: string;
};

export const WORKFLOW_TYPES: Record<WorkflowType, WorkflowTypeInfo> = {
  [WorkflowType.conversational]: {
    key: WorkflowType.conversational,
    labelKey: "label.conversational",
    icon: MessagesSquare,
    color: theme.palette.info.main,
  },
  [WorkflowType.scheduled]: {
    key: WorkflowType.scheduled,
    labelKey: "label.scheduled",
    icon: Clock,
    color: theme.palette.warning.main,
  },
  [WorkflowType.manual]: {
    key: WorkflowType.manual,
    labelKey: "label.manual",
    icon: Hand,
    color: theme.palette.success.main,
  },
};

export const WORKFLOW_TYPE_ORDER: Record<WorkflowType, number> = {
  [WorkflowType.conversational]: 0,
  [WorkflowType.scheduled]: 1,
  [WorkflowType.manual]: 2,
};
