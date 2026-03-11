/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { StepType } from "@hexabot-ai/agentic";
import { MarkerType, type Node } from "@xyflow/react";
import {
  Brain,
  ChartNoAxesGantt,
  CircleStop,
  GitBranch,
  ListTree,
  Play,
  Plus,
  Repeat,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  EEdgeType,
  EIndicatorType,
  ELinkType,
  ENodeType,
  type INodeConfig,
  type WorkflowGraphData,
} from "../types/workflow-node.types";
import type { EdgeInsertType } from "../types/workflow-path.types";

const WORKFLOW_OPERATOR_GRAPH_THEME = {
  [StepType.Parallel]: {
    Icon: ListTree,
    nodeTheme: {
      Icon: ListTree,
      borderColor: "#0c9ba0",
    },
    i18nTitle: "message.parallel_indicator",
  },
  [StepType.Conditional]: {
    Icon: GitBranch,
    nodeTheme: {
      Icon: GitBranch,
      borderColor: "#2162fb",
    },
    i18nTitle: "message.conditional_indicator",
  },
  [StepType.Loop]: {
    Icon: Repeat,
    nodeTheme: {
      Icon: Repeat,
      borderColor: "#0c9ba0",
    },
    i18nTitle: "message.loop_indicator",
  },
} as const;

export type WorkflowInsertMenuItem = {
  id: string;
  type: EdgeInsertType;
  Icon: LucideIcon;
  i18nTitle: string;
};

export const WORKFLOW_INSERT_MENU_ITEMS: WorkflowInsertMenuItem[] = [
  {
    id: "step",
    type: "step",
    Icon: ChartNoAxesGantt,
    i18nTitle: "label.step_trace.type_step",
  },
  {
    id: StepType.Conditional,
    type: StepType.Conditional,
    Icon: WORKFLOW_OPERATOR_GRAPH_THEME[StepType.Conditional].Icon,
    i18nTitle: WORKFLOW_OPERATOR_GRAPH_THEME[StepType.Conditional].i18nTitle,
  },
  {
    id: StepType.Loop,
    type: StepType.Loop,
    Icon: WORKFLOW_OPERATOR_GRAPH_THEME[StepType.Loop].Icon,
    i18nTitle: WORKFLOW_OPERATOR_GRAPH_THEME[StepType.Loop].i18nTitle,
  },
  {
    id: StepType.Parallel,
    type: StepType.Parallel,
    Icon: WORKFLOW_OPERATOR_GRAPH_THEME[StepType.Parallel].Icon,
    i18nTitle: WORKFLOW_OPERATOR_GRAPH_THEME[StepType.Parallel].i18nTitle,
  },
];

export const VIEWPORT_EPSILON = 0.01;
export const EMPTY_WORKFLOW_GRAPH: WorkflowGraphData = { nodes: [], edges: [] };

export const DEFAULT_NODE_PROPS = {
  draggable: false,
  focusable: false,
  selectable: false,
} satisfies Omit<Node, "id" | "data" | "position">;

export const NODE_DIMENSIONS = {
  [ENodeType.BINDING_SINGLE]: { width: 180, height: 68 },
  [ENodeType.BINDING_MULTI]: { width: 180, height: 55 },
  [ENodeType.BINDING_PLACEHOLDER]: { width: 64, height: 64 },
  [ENodeType.INDICATOR]: { width: 128, height: 68 },
  [ENodeType.TASK]: { width: 256, height: 86 },
  [ENodeType.OPERATOR]: { width: 156, height: 68 },
  [ENodeType.BRANCH_PLACEHOLDER]: { width: 64, height: 64 },
} satisfies INodeConfig["dimensions"];

export const OPERATOR_HIGHLIGHTS = {
  [StepType.Loop]: { color: "#fefbe8", padding: 64 },
  [StepType.Parallel]: { color: "#fefbe8", padding: 64 },
  [StepType.Conditional]: { color: "#fefbe8", padding: 64 },
} satisfies INodeConfig["highlights"];

export const EDGE_STYLES = {
  [EEdgeType.EDGE_WITH_BUTTON]: {
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#777",
      strokeWidth: 2,
    },
    style: { stroke: "#777", strokeWidth: "2px" },
  },
} satisfies INodeConfig["edges"];

export const NODE_DEFINITIONS = {
  [ENodeType.BINDING_MULTI]: {
    title: "",
    ports: [ELinkType.BINDING_MULTI_IN],
    theme: {
      Icon: Zap,
      borderColor: "orange",
    },
  },
  [ENodeType.BINDING_PLACEHOLDER]: {
    title: "",
    description: "",
    bindingKind: "",
    ports: [ELinkType.BINDING_PLACEHOLDER_IN],
    theme: {
      Icon: Plus,
      borderColor: "#7f8ea3",
    },
  },
  [ENodeType.BINDING_SINGLE]: {
    title: "",
    ports: [ELinkType.BINDING_SINGLE_IN],
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
  [ENodeType.TASK]: {
    title: "",
    actionName: "",
    description: "",
    ports: [ELinkType.TASK_IN, ELinkType.TASK_OUT],
    theme: {},
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
