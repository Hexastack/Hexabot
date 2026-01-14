/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Build,
  DragHandle,
  MarkChatRead,
  PlayArrowRounded,
  Psychology,
  Repeat,
  SmartToyOutlined,
  StopRounded,
} from "@mui/icons-material";
import { MarkerType, Node } from "@xyflow/react";

import SimpleTextIcon from "@/app-components/svg/toolbar/SimpleTextIcon";

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

export const DEFAULT_NODE_PROPS = {
  draggable: false,
  focusable: false,
  selectable: false,
} satisfies Omit<Node, "id" | "data" | "position">;

export const DIMENSIONS = {
  [ENodeType.MODEL]: { width: 90, height: 90 },
  [ENodeType.TOOL]: { width: 90, height: 90 },
  [ENodeType.AGENT]: { width: 352, height: 132 },
  [ENodeType.INDICATOR]: { width: 90, height: 90 },
  [ENodeType.TASK]: { width: 352, height: 132 },
  [ENodeType.OPERATOR]: { width: 90, height: 90 },
} satisfies INodeConfig["dimensions"];
export const HIGHLIGHTS = {
  [EOperatorType.LOOP]: { color: "#b0e7b0", padding: 60 },
  [EOperatorType.PARALLEL]: { color: "#add8e6", padding: 60 },
  [EOperatorType.CONDITIONAL]: { color: "#f0e68c", padding: 60 },
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
      Icon: SmartToyOutlined,
      color: "#444444",
      bgColor: "#7bb0ff",
    },
  },
  [ENodeType.TOOL]: {
    title: "",
    ports: [ELinkType.TOOL_IN],
    theme: {
      Icon: Build,
      color: "#555555",
      bgColor: "#7bb0ff",
    },
  },
  [ENodeType.MODEL]: {
    title: "",
    ports: [ELinkType.MODEL_IN],
    theme: {
      Icon: Psychology,
      color: "#555555",
      bgColor: "#8160f7",
    },
  },
  [ENodeType.INDICATOR]: {
    [EIndicatorType.START]: {
      theme: {
        Icon: PlayArrowRounded,
        color: "#555555",
        bgColor: "#97d445",
      },
      ports: [ELinkType.INDICATOR_OUT],
      i18n: "message.start",
    },
    [EIndicatorType.END]: {
      theme: {
        Icon: StopRounded,
        color: "#555555",
        bgColor: "#e95d32",
      },
      ports: [ELinkType.INDICATOR_IN],
      i18n: "message.end",
    },
  },
  [ENodeType.OPERATOR]: {
    [EOperatorType.PARALLEL]: {
      operatorType: EOperatorType.PARALLEL,
      theme: {
        Icon: DragHandle,
        color: "#555555",
        bgColor: "#0c9ba0",
      },
      i18n: "message.parallel_indicator",
      ports: [ELinkType.OPERATOR_IN, ELinkType.OPERATOR_OUT],
    },
    [EOperatorType.CONDITIONAL]: {
      operatorType: EOperatorType.CONDITIONAL,
      taskName: "conditional",
      theme: {
        Icon: MarkChatRead,
        color: "#555555",
        bgColor: "#0c9ba0",
      },
      i18n: "message.conditional_indicator",
      ports: [ELinkType.OPERATOR_IN, ELinkType.OPERATOR_OUT],
    },
    [EOperatorType.LOOP]: {
      operatorType: EOperatorType.LOOP,
      theme: {
        Icon: Repeat,
        color: "#555555",
        bgColor: "#0c9ba0",
      },
      i18n: "message.loop_indicator",
      ports: [ELinkType.OPERATOR_IN, ELinkType.OPERATOR_OUT],
    },
  },
  [ENodeType.TASK]: (id, step, tasks) => {
    const groupName = getGroupId(id, HIGHLIGHTS);

    return {
      name: step["do"],
      action: getTaskAction(step["do"], tasks),
      description: getTaskDescription(step["do"], tasks),
      ports: [ELinkType.TASK_IN, ELinkType.TASK_OUT],
      theme: {
        Icon: SimpleTextIcon,
        color: "#555555",
        bgColor: "#7bb0ff",
      },
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
