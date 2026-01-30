/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { MarkerType, type Node } from "@xyflow/react";
import {
  Bot,
  Brain,
  ChartNoAxesGantt,
  Check,
  CircleStop,
  Clock,
  Database,
  GitBranch,
  GripVertical,
  Hand,
  MessageSquare,
  Pause,
  Play,
  Repeat,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { TTranslationKeys } from "@/i18n/i18n.types";
import { theme } from "@/layout/themes/theme";
import { EWorkflowRunStatus } from "@/types/workflow-run.types";
import { WorkflowType } from "@/types/workfow.types";

import type { FlowTypeInfo } from "../components/visual-editor/v4/components/main/FlowsDrawer/types";
import {
  EEdgeType,
  EIndicatorType,
  ELinkType,
  ENodeType,
  EOperatorType,
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
  [ENodeType.AGENT]: { width: 260, height: 75 },
  [ENodeType.INDICATOR]: { width: 100, height: 56 },
  [ENodeType.TASK]: { width: 260, height: 75 },
  [ENodeType.OPERATOR]: { width: 150, height: 55 },
  [ENodeType.MEMORY]: { width: 250, height: 75 },
} satisfies INodeConfig["dimensions"];
export const HIGHLIGHTS = {
  // [EOperatorType.LOOP]: { color: "#b0e7b0", padding: 60 },
  // [EOperatorType.PARALLEL]: { color: "#add8e6", padding: 60 },
  // [EOperatorType.CONDITIONAL]: { color: "#fefbe8", padding: 60 },
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
    [EOperatorType.PARALLEL]: {
      operatorType: EOperatorType.PARALLEL,
      theme: {
        Icon: GripVertical,
        bgColor: "#0c9ba0",
      },
      i18nTitle: "message.parallel_indicator",
      ports: [ELinkType.OPERATOR_IN, ELinkType.OPERATOR_OUT],
    },
    [EOperatorType.CONDITIONAL]: {
      operatorType: EOperatorType.CONDITIONAL,
      theme: {
        Icon: GitBranch,
        borderColor: "#2162fb",
      },
      i18nTitle: "message.conditional_indicator",
      ports: [ELinkType.OPERATOR_IN, ELinkType.OPERATOR_OUT],
    },
    [EOperatorType.LOOP]: {
      operatorType: EOperatorType.LOOP,
      theme: {
        Icon: Repeat,
        borderColor: "#0c9ba0",
      },
      i18nTitle: "message.loop_indicator",
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
} satisfies INodeConfig["nodes"];

export const WORKFLOW_STATUS: Record<
  EWorkflowRunStatus,
  Omit<FlowTypeInfo, "labelKey">
> = {
  [EWorkflowRunStatus.FAILED]: {
    key: WorkflowType.conversational,
    icon: X,
    color: theme.palette.error.main,
    background: "#f8f8f8",
  },
  [EWorkflowRunStatus.FINISHED]: {
    key: WorkflowType.conversational,
    icon: Check,
    color: theme.palette.success.main,
    background: "#f8f8f8",
  },
  [EWorkflowRunStatus.IDLE]: {
    key: WorkflowType.conversational,
    icon: ChartNoAxesGantt,
    color: theme.palette.info.main,
    background: "#f8f8f8",
  },
  [EWorkflowRunStatus.RUNNING]: {
    key: WorkflowType.conversational,
    icon: Play,
    color: theme.palette.success.main,
    background: "#f8f8f8",
  },
  [EWorkflowRunStatus.SUSPENDED]: {
    key: WorkflowType.conversational,
    icon: Pause,
    color: theme.palette.warning.main,
    background: "#f8f8f8",
  },
};

type WorkflowTypeInfo = {
  key: WorkflowType;
  labelKey: TTranslationKeys;
  icon: LucideIcon;
  color: string;
  background: string;
};

export const WORKFLOW_TYPES: Record<WorkflowType, WorkflowTypeInfo> = {
  [WorkflowType.conversational]: {
    key: WorkflowType.conversational,
    labelKey: "label.conversational",
    icon: MessageSquare,
    color: "#1d4ed8",
    background: "#e0ecff",
  },
  [WorkflowType.scheduled]: {
    key: WorkflowType.scheduled,
    labelKey: "label.scheduled",
    icon: Clock,
    color: "#b45309",
    background: "#fef3c7",
  },
  [WorkflowType.manual]: {
    key: WorkflowType.manual,
    labelKey: "label.manual",
    icon: Hand,
    color: "#047857",
    background: "#d1fae5",
  },
};

export const WORKFLOW_TYPE_ORDER: Record<WorkflowType, number> = {
  [WorkflowType.conversational]: 0,
  [WorkflowType.scheduled]: 1,
  [WorkflowType.manual]: 2,
};
