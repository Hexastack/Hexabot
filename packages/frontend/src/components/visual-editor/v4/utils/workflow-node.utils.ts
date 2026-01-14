/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  compileWorkflow,
  validateWorkflow,
  type WorkflowCompileOptions,
} from "@hexabot-ai/agentic";
import { Edge, getNodesBounds, Position } from "@xyflow/react";
import ELK, { ElkNode } from "elkjs/lib/elk.bundled.js";
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
  ELinkType,
  ENodeType,
  type IBuildNodesAndEdgesProps,
  type NodeData,
} from "../types/workflow-node.types";

import {
  getGroupId,
  getNodeDimensions,
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

const getElkGraph = (
  ctx: TraversalContext,
  isHorizontal: boolean,
  edges: Edge[],
) => {
  const nodeIds = new Set(ctx.nodes.map((node) => node.id));
  const elkEdges = edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
  );
  const elkNodes = ctx.nodes.map((node) => {
    const { width, height } = getNodeDimensions(node.type, ctx.config);

    return {
      id: node.id,
      width,
      height,
    };
  }) satisfies ElkNode[];

  return {
    id: "root",
    layoutOptions: {
      "elk.direction": isHorizontal ? "RIGHT" : "DOWN",
      "elk.spacing.nodeNode": "20",
      "elk.layered.spacing.nodeNodeBetweenLayers": "140",
      // "elk.layered.crossingMinimization.forceNodeModelOrder": "false",
      // "elk.partitioning.activate": "true",
      // Ensure the algorithm respects the partition order
      // "elk.layered.crossingMinimization.semiInteractive": "true",
      // "elk.layered.crossingMinimization.semiInteractive": "true",
    },
    children: elkNodes,
    edges: elkEdges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  } satisfies ElkNode;
};

export const getElkLayoutedElements = async (ctx: TraversalContext) => {
  const elk = new ELK();

  if (!ctx.config?.direction) {
    return { edges: ctx.edges, nodes: ctx.nodes };
  }

  const isHorizontal = ctx.config.direction === "horizontal";
  const elkGraph = getElkGraph(ctx, isHorizontal, ctx.edges);
  const { children = [] } = await elk.layout(elkGraph);
  const layoutById = new Map(children.map((child) => [child.id, child]));
  const nodes = ctx.nodes.map((node) => {
    const layoutNode = layoutById.get(node.id);
    const x = layoutNode?.x ?? 0;
    const y = layoutNode?.y ?? 0;

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: { x, y },
    };
  });

  return { nodes, edges: ctx.edges };
};

const placeExtraNodes = (
  nodes: NodeData[],
  edges: Edge[],
  ctx: TraversalContext,
) => {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const targetsBy = new Map<string, NodeData[]>();

  edges.forEach((edge) => {
    const sourceNode = nodesById.get(edge.source);
    const targetNode = nodesById.get(edge.target);

    if (sourceNode && targetNode) {
      const list = targetsBy.get(sourceNode.id) || [];

      list.push(targetNode);
      targetsBy.set(sourceNode.id, list);
    }
  });

  if (!targetsBy.size) {
    return nodes;
  }

  const OFFSET = 80;
  const GAP = 20;
  const overridePositions = new Map<
    string,
    { x: number; y: number; targetPosition: Position; sourcePosition: Position }
  >();
  const isHorizontal = ctx.config?.direction === "horizontal";

  targetsBy.forEach((targets, id) => {
    const node = nodesById.get(id);

    if (!node) return;

    const dimensions = getNodeDimensions(node.type, ctx.config);
    const targetWithDimensions = targets.map((node) => ({
      node,
      dimensions: getNodeDimensions(node.type, ctx.config),
    }));

    if (isHorizontal) {
      const totalWidth =
        targetWithDimensions.reduce(
          (acc, { dimensions }) => acc + dimensions.width,
          0,
        ) +
        GAP * Math.max(0, targets.length - 1);
      let currentX = node.position.x + (dimensions.width - totalWidth) / 2;
      const y = node.position.y + dimensions.height + OFFSET;

      targetWithDimensions.forEach(({ node: targetNode, dimensions }) => {
        overridePositions.set(targetNode.id, {
          x: currentX,
          y,
          targetPosition: Position.Top,
          sourcePosition: Position.Bottom,
        });
        currentX += dimensions.width + GAP;
      });
    } else {
      const maxWidth = Math.max(
        ...targetWithDimensions.map(({ dimensions }) => dimensions.width),
      );
      const totalHeight =
        targetWithDimensions.reduce(
          (acc, { dimensions }) => acc + dimensions.height,
          0,
        ) +
        GAP * Math.max(0, targets.length - 1);
      const x = node.position.x - OFFSET - maxWidth;
      let currentY = node.position.y + (dimensions.height - totalHeight) / 2;

      targetWithDimensions.forEach(({ node: targetNode, dimensions }) => {
        overridePositions.set(targetNode.id, {
          x,
          y: currentY,
          targetPosition: Position.Right,
          sourcePosition: Position.Left,
        });
        currentY += dimensions.height + GAP;
      });
    }
  });

  return nodes.map((node) => {
    const override = overridePositions.get(node.id);

    if (!override) return node;

    return {
      ...node,
      position: { x: override.x, y: override.y },
      targetPosition: override.targetPosition,
      sourcePosition: override.sourcePosition,
    };
  });
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
          backgroundColor: color ? `${color}99` : undefined,
          border: "1px solid #0004",
        },
      });
    });

  return groups;
};

export const buildNodesAndEdges = async ({
  config,
  definition,
}: IBuildNodesAndEdgesProps): Promise<
  { nodes: NodeData[]; edges: Edge[] } | undefined
> => {
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
    ...getNodeDimensions(ENodeType.INDICATOR, ctx.config),
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
  const { nodes, edges } = await getElkLayoutedElements(ctx);
  const nodesWithTools = placeExtraNodes(
    nodes,
    edges.filter((e) =>
      [ELinkType.AGENT_TOOL, ELinkType.AGENT_MODEL].includes(
        e.sourceHandle as ELinkType,
      ),
    ),
    ctx,
  );
  const groupNodes = getGroupNodes(nodes, ctx);
  const anchoredNodes = [...nodesWithTools, ...groupNodes];

  return {
    edges,
    nodes: anchoredNodes,
  };
};

export const getDefinition = (
  yaml: string,
  options: WorkflowCompileOptions,
) => {
  const validation = validateWorkflow(yaml);

  if (!validation.success) {
    throw new Error(
      `Workflow validation failed: ${validation.errors.join("; ")}`,
    );
  }
  const { definition } = compileWorkflow(validation.data, options);

  return definition;
};
