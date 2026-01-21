/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { MarkerType, type Node } from "@xyflow/react";
import {
  Bot,
  Brain,
  CircleStop,
  GitBranch,
  GripVertical,
  Play,
  Repeat,
  Zap,
} from "lucide-react";

import {
  EEdgeType,
  EIndicatorType,
  ELinkType,
  ENodeType,
  EOperatorType,
  type INodeConfig,
} from "../types/workflow-node.types";
import {
  getGroupId,
  getTaskAction,
  getTaskDescription,
} from "../utils/graph.utils";

export const DEFAULT_WORKFLOW_NAME = "new_workflow";
export const DEFAULT_WORKFLOW_VERSION = "1.0.0";

export const DEFAULT_NODE_PROPS = {
  draggable: false,
  focusable: false,
  selectable: false,
} satisfies Omit<Node, "id" | "data" | "position">;

export const DIMENSIONS = {
  [ENodeType.MODEL]: { width: 260, height: 65 },
  [ENodeType.TOOL]: { width: 260, height: 65 },
  [ENodeType.AGENT]: { width: 260, height: 85 },
  [ENodeType.INDICATOR]: { width: 110, height: 65 },
  [ENodeType.TASK]: { width: 260, height: 85 },
  [ENodeType.OPERATOR]: { width: 150, height: 65 },
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
  [ENodeType.AGENT]: {
    memory: "",
    model: "",
    tools: [],
    ports: [
      ELinkType.AGENT_IN,
      ELinkType.AGENT_OUT,
      ELinkType.AGENT_TOOL,
      ELinkType.AGENT_MODEL,
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
  [ENodeType.TASK]: (id, step, tasks) => {
    const groupName = getGroupId(id, HIGHLIGHTS);

    return {
      title: step["do"],
      actionName: getTaskAction(step["do"], tasks),
      description: getTaskDescription(step["do"], tasks),
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
