/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import dagre from "@dagrejs/dagre";
import { Edge, getNodesBounds, Position } from "@xyflow/react";
import type { FC } from "react";

import AttachmentIcon from "@/app-components/svg/toolbar/AttachmentIcon";
import ButtonsIcon from "@/app-components/svg/toolbar/ButtonsIcon";
import ListIcon from "@/app-components/svg/toolbar/ListIcon";
import PluginIcon from "@/app-components/svg/toolbar/PluginIcon";
import QuickRepliesIcon from "@/app-components/svg/toolbar/QuickRepliesIcon";
import SimpleTextIcon from "@/app-components/svg/toolbar/SimpleTextIcon";
import { generateId } from "@/utils/generateId";

import { DEFAULT_NODE_PROPS } from "../constants/workflow.constants";
import {
  EEdgeType,
  EIndicatorType,
  ENodeType,
  type IBuildNodesAndEdgesProps,
  type NodeData,
} from "../types/workflow-node.types";

import {
  getDimensions,
  getGroupId,
  walkSteps,
  type TraversalContext,
} from "./graph.utils";

// TODO
enum EActionType {
  TEXT = "send_text_message",
  ATTACHMENT = "send_attachment",
  QUICK_REPLIES = "send_quick_replies",
  BUTTONS = "send_buttons",
  LIST = "send_list",
  REPLY = "reply",
}

// TODO
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getActionConfig = (
  action: `${EActionType}`,
): { color: string; Icon: FC<React.SVGProps<SVGSVGElement>> } => {
  switch (action) {
    case "send_text_message":
      return { color: "#009185", Icon: SimpleTextIcon };
    case "send_attachment":
      return { color: "#e6a23c", Icon: AttachmentIcon };
    case "send_quick_replies":
      return { color: "#a80551", Icon: QuickRepliesIcon };
    case "send_buttons":
      return { color: "#570063", Icon: ButtonsIcon };
    case "send_list":
      return { color: "#108aa8", Icon: ListIcon };
    case "reply":
      return { color: "#a8ba33", Icon: PluginIcon };
    default:
      throw new Error("Unexpected case");
  }
};

export const getDagreLayoutedElements = (ctx: TraversalContext) => {
  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  if (!ctx.config?.direction) {
    return { edges: ctx.edges, nodes: ctx.nodes };
  }

  const isHorizontal = ctx.config?.direction === "horizontal";

  dagreGraph.setGraph({
    rankdir: isHorizontal ? "LR" : "LH",
    nodesep: 20,
    ranksep: 140,
  });

  ctx.nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      ...getDimensions(node.type, ctx.config),
    });
  });

  ctx.edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const nodes = ctx.nodes.map((node) => {
    const { height, width } = getDimensions(node.type, ctx.config);
    const { x, y } = dagreGraph.node(node.id);

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: x - width / 2,
        y: y - height / 2,
      },
    };
  });

  return { nodes, edges: ctx.edges };
};

export const getGroupNodes = (nodes: NodeData[], ctx: TraversalContext) => {
  const groups: NodeData<ENodeType.GROUP>[] = [];

  (nodes as NodeData<ENodeType.OPERATOR>[])
    .filter(
      ({ data }) =>
        data.operatorType &&
        ctx.config?.highlights?.[data.operatorType] &&
        data.level === 0,
    )
    .forEach((n) => {
      if (!ctx.config) {
        return;
      }
      const groupId = n.id;
      const color =
        n.data.operatorType &&
        ctx.config?.highlights?.[n.data.operatorType]?.color;
      const padding =
        (n.data.operatorType &&
          ctx.config?.highlights?.[n.data.operatorType]?.padding) ||
        0;
      const groupNodes = nodes.filter((n) => n.id.startsWith(groupId));
      const groupBounds = getNodesBounds(groupNodes);

      groups.push({
        ...DEFAULT_NODE_PROPS,
        id: n.data.groupName || "",
        type: ENodeType.GROUP,
        position: {
          x: groupBounds.x - padding / 2,
          y: groupBounds.y - padding / 2,
        },
        data: ctx.config?.nodes[ENodeType.GROUP],
        style: {
          width: groupBounds.width + padding,
          height: groupBounds.height + padding,
          zIndex: -1,
          borderRadius: "13px",
          backgroundColor: color ? `${color}33` : undefined,
          border: "1px solid #0004",
        },
      });
    });

  return groups;
};

export const buildNodesAndEdges = ({
  config,
  definition,
}: IBuildNodesAndEdgesProps):
  | { nodes: NodeData[]; edges: Edge[] }
  | undefined => {
  if (!definition) return;
  const ctx: TraversalContext = {
    tasks: definition.tasks,
    nodes: [],
    edges: [],
    edgeKeys: new Set(),
    config,
  };
  const endStepIds = walkSteps({
    index: 0,
    steps: definition.flow,
    tasks: definition.tasks,
    level: 0,
    prefix: "step",
    incoming: [],
    ctx,
  });

  if (!ctx.config) {
    return { nodes: [], edges: [] };
  }

  ctx.nodes.push({
    ...getDimensions(ENodeType.INDICATOR, ctx.config),
    ...DEFAULT_NODE_PROPS,
    id: `${EIndicatorType.END}-${endStepIds.at(-1)}`,
    type: ENodeType.INDICATOR,
    position: { x: 0, y: 0 },
    data: ctx.config?.nodes[ENodeType.INDICATOR][EIndicatorType.END],
  });

  endStepIds.forEach((endEdgesId) => {
    const groupName = getGroupId(endEdgesId, ctx.config?.highlights);

    ctx.edges.push({
      id: generateId(),
      source: endEdgesId,
      target: `${EIndicatorType.END}-${endStepIds.at(-1)}`,
      type: EEdgeType.EDGE_WITH_BUTTON,
      ...ctx.config?.edges?.[EEdgeType.EDGE_WITH_BUTTON],
    });

    if (ctx.edges.findIndex((n) => n.id === groupName) && groupName) {
      ctx.edges.push({
        id: generateId(),
        source: groupName,
        target: `${EIndicatorType.END}-${endStepIds.at(-1)}`,
        type: EEdgeType.EDGE_WITH_BUTTON,
        ...ctx.config?.edges?.[EEdgeType.EDGE_WITH_BUTTON],
      });
    }
  });

  const { nodes, edges } = getDagreLayoutedElements(ctx);
  const groupNodes = getGroupNodes(nodes, ctx);

  return {
    edges,
    nodes: [...nodes, ...groupNodes],
  };
};
