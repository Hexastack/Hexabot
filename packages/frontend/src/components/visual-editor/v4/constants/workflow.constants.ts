/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  DragHandle,
  MarkChatRead,
  PlayArrowRounded,
  Repeat,
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
  [ENodeType.INDICATOR]: { width: 90, height: 90 },
  [ENodeType.TASK]: { width: 352, height: 132 },
  [ENodeType.OPERATOR]: { width: 140, height: 82 },
} satisfies INodeConfig["dimensions"];
export const HIGHLIGHTS = {
  [EOperatorType.LOOP]: { color: "#eeff01", padding: 60 },
  [EOperatorType.PARALLEL]: { color: "#00acfc", padding: 60 },
  [EOperatorType.CONDITIONAL]: { color: "#ffa600", padding: 60 },
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
  [ENodeType.INDICATOR]: {
    [EIndicatorType.START]: {
      theme: {
        Icon: PlayArrowRounded,
        color: "#000",
        backgroundColor: "#97d445",
      },
      ports: [ELinkType.INDICATOR_OUT],
      title: { color: "#000", i18n: "message.start" },
    },
    [EIndicatorType.END]: {
      theme: {
        Icon: StopRounded,
        backgroundColor: "#e95d32",
        color: "#000",
      },
      ports: [ELinkType.INDICATOR_IN],
      title: { color: "#000", i18n: "message.end" },
    },
  },
  [ENodeType.OPERATOR]: {
    [EOperatorType.PARALLEL]: {
      operatorType: EOperatorType.PARALLEL,
      theme: {
        Icon: DragHandle,
        color: "#000",
        backgroundColor: "#0c9ba0",
      },
      title: { i18n: "message.parallel_indicator", color: "#000" },
      ports: [ELinkType.OPERATOR_IN, ELinkType.OPERATOR_OUT],
    },
    [EOperatorType.CONDITIONAL]: {
      operatorType: EOperatorType.CONDITIONAL,
      taskName: "conditional",
      theme: {
        Icon: MarkChatRead,
        color: "#000",
        backgroundColor: "#0c9ba0",
      },
      title: { i18n: "message.conditional_indicator", color: "#000" },
      ports: [ELinkType.OPERATOR_IN, ELinkType.OPERATOR_OUT],
    },
    [EOperatorType.LOOP]: {
      operatorType: EOperatorType.LOOP,
      theme: {
        Icon: Repeat,
        color: "#000",
        backgroundColor: "#0c9ba0",
      },
      title: { i18n: "message.loop_indicator", color: "#000" },
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
        color: "#444444",
        bgColor: "#7bb0ff",
      },
      groupName,
    };
  },
  [ENodeType.GROUP]: {
    ports: [ELinkType.GROUP_IN, ELinkType.GROUP_OUT],
    theme: {
      backgroundColor: "#7bb0ff",
    },
  },
} satisfies INodeConfig["nodes"];
