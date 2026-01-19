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
import ELK from "elkjs/lib/elk.bundled.js";

import { generateId } from "@/utils/generateId";

import { DEFAULT_NODE_PROPS } from "../constants/workflow.constants";
import {
  EEdgeType,
  EHandleType,
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
import { getHandleConfig } from "./handle.utils";

const elk = new ELK();
const getElkSide = (position: Position) => {
  switch (position) {
    case Position.Top:
      return "NORTH";
    case Position.Bottom:
      return "SOUTH";
    case Position.Left:
      return "WEST";
    case Position.Right:
      return "EAST";
    default:
      return "EAST";
  }
};

type ElkPort = {
  handleId: ELinkType;
  elkId: string;
  side: string;
  type: EHandleType;
};

const toElk = (nodes: NodeData[], edges: Edge[], ctx: TraversalContext) => {
  const isVertical = ctx.config?.direction === "vertical";
  const direction = ctx.config?.direction ?? "horizontal";
  const elkDirection = isVertical ? "DOWN" : "RIGHT";
  const nodeIds = new Set(nodes.map((n) => n.id));
  const nodePorts = new Map<string, ElkPort[]>();
  const resolvePort = (
    ports: ElkPort[] | undefined,
    preferredHandle?: string | null,
    preferredType?: EHandleType,
  ) => {
    if (!ports?.length) return;

    if (preferredHandle) {
      const handlePort = ports.find((p) => p.handleId === preferredHandle);

      if (handlePort) {
        return handlePort.elkId;
      }
    }

    if (preferredType) {
      const typedPort = ports.find((p) => p.type === preferredType);

      if (typedPort) {
        return typedPort.elkId;
      }
    }

    return ports[0]?.elkId;
  };

  return {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "org.eclipse.elk.direction": elkDirection,
      "elk.spacing.nodeNode": "20",
      "elk.layered.spacing.nodeNodeBetweenLayers": "140",
    },
    children: nodes.map((n) => {
      const ports =
        (n.data as { ports?: ELinkType[] })?.ports?.map((handleId) => {
          const handle = getHandleConfig(handleId, direction);

          return {
            handleId,
            elkId: `${n.id}__${handleId}`,
            side: getElkSide(handle.position),
            type: handle.type,
          } as ElkPort;
        }) ?? [];

      nodePorts.set(n.id, ports);

      return {
        id: n.id,
        ...getNodeDimensions(n.type, ctx.config),
        layoutOptions: {
          "org.eclipse.elk.portConstraints": "FIXED_ORDER",
        },
        ports: ports.map((port) => ({
          id: port.elkId,
          properties: { "org.eclipse.elk.port.side": port.side },
        })),
      };
    }),
    edges: edges
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e) => {
        return {
          id: e.id,
          sources: [
            resolvePort(
              nodePorts.get(e.source),
              e.sourceHandle,
              EHandleType.SOURCE,
            ) ?? `${e.source}__out`,
          ],
          targets: [
            resolvePort(
              nodePorts.get(e.target),
              e.targetHandle,
              EHandleType.TARGET,
            ) ?? `${e.target}__in`,
          ],
        };
      }),
  };
};

export const layoutNodesWithElk = async (
  nodes: NodeData[],
  edges: Edge[],
  ctx: TraversalContext,
) => {
  const g = await elk.layout(toElk(nodes, edges, ctx));
  const pos = new Map<string, { x: number; y: number }>();

  g.children?.forEach((c: any) => pos.set(c.id, { x: c.x, y: c.y }));

  return nodes.map((n) => ({
    ...n,
    position: pos.get(n.id) ?? n.position,
  }));
};

const getExtraNodes = (
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

  return nodes
    .filter((n) => overridePositions.get(n.id))
    .map((node) => {
      const { sourcePosition, targetPosition, x, y } = overridePositions.get(
        node.id,
      )!;

      return {
        ...node,
        position: { x, y },
        targetPosition,
        sourcePosition,
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
  const nodes = await layoutNodesWithElk(ctx.nodes, ctx.edges, ctx);
  const extraNodes = getExtraNodes(
    nodes,
    ctx.edges.filter((e) =>
      [ELinkType.AGENT_TOOL, ELinkType.AGENT_MODEL].includes(
        e.sourceHandle as ELinkType,
      ),
    ),
    ctx,
  );
  const groupNodes = getGroupNodes(nodes, ctx);
  const anchoredNodes = [...nodes, ...extraNodes, ...groupNodes];

  return {
    edges: ctx.edges,
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
