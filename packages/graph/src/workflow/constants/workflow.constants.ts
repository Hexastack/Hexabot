/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { StepType, type TaskDefinitions } from "@hexabot-ai/agentic";
import { MarkerType, type Node } from "@xyflow/react";
import {
  Bot,
  Brain,
  CircleStop,
  Database,
  GitBranch,
  ListTree,
  Play,
  Plus,
  Repeat,
  Zap,
} from "lucide-react";

import {
  EEdgeType,
  EIndicatorType,
  ELinkType,
  ENodeType,
  type INodeConfig,
} from "../types/workflow-node.types";

const WORKFLOW_OPERATOR_GRAPH_THEME = {
  [StepType.Parallel]: {
    Icon: ListTree,
    color: "#0c9ba0",
    nodeTheme: {
      Icon: ListTree,
      borderColor: "#0c9ba0",
    },
    i18nTitle: "message.parallel_indicator",
  },
  [StepType.Conditional]: {
    Icon: GitBranch,
    color: "#2162fb",
    nodeTheme: {
      Icon: GitBranch,
      borderColor: "#2162fb",
    },
    i18nTitle: "message.conditional_indicator",
  },
  [StepType.Loop]: {
    Icon: Repeat,
    color: "#0c9ba0",
    nodeTheme: {
      Icon: Repeat,
      borderColor: "#0c9ba0",
    },
    i18nTitle: "message.loop_indicator",
  },
} as const;
const getTaskDescription = (
  taskName: string,
  tasks?: TaskDefinitions,
): string => {
  return tasks?.[taskName]?.description ?? "No description provided.";
};
const getTaskAction = (taskName: string, tasks?: TaskDefinitions) => {
  return tasks?.[taskName]?.action;
};

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
  [ENodeType.BRANCH_PLACEHOLDER]: { width: 64, height: 64 },
} satisfies INodeConfig["dimensions"];

export const HIGHLIGHTS = {
  [StepType.Loop]: { color: "#fefbe8", padding: 64 },
  [StepType.Parallel]: { color: "#fefbe8", padding: 64 },
  [StepType.Conditional]: { color: "#fefbe8", padding: 64 },
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
      { id: ELinkType.AGENT_TOOL, label: "visual_editor.port_label.tools" },
      { id: ELinkType.AGENT_MODEL, label: "visual_editor.port_label.model" },
      {
        id: ELinkType.AGENT_MEMORY,
        label: "visual_editor.port_label.memory",
      },
    ],
    theme: {
      Icon: Bot,
      borderColor: "#b65bfd",
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
  [ENodeType.TASK]: (_nodeId, taskName, tasks) => {
    return {
      title: taskName,
      actionName: getTaskAction(taskName, tasks),
      description: getTaskDescription(taskName, tasks),
      ports: [ELinkType.TASK_IN, ELinkType.TASK_OUT],
      theme: {},
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
