/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { getNodesBounds, Position, type Edge } from "@xyflow/react";
import type { ResizeControlDirection } from "@xyflow/system";
import ELK from "elkjs/lib/elk.bundled.js";

import {
  DEFAULT_NODE_PROPS,
  EDGE_STYLES,
  NODE_DEFINITIONS,
  NODE_DIMENSIONS,
  OPERATOR_HIGHLIGHTS,
} from "../constants/workflow.constants";
import {
  EHandleType,
  ENodeType,
  getWorkflowPortId,
  type GraphNode,
  type IBuildNodesAndEdgesProps,
  type INodeConfig,
  type WorkflowNodePort,
  type WorkflowPort,
} from "../types/workflow-node.types";

import { withAlpha } from "./color.utils";
import { decorateSemanticGraph } from "./graph-builder/decorate";
import { projectSemanticGraph } from "./graph-builder/project";
import { traverseWorkflow } from "./graph-builder/traverse";
import type { GroupMeta } from "./graph-builder/types";
import {
  isAttachmentSourceHandle,
  resolveWorkflowPortRule,
} from "./port-rules";

const elk = new ELK();
const GROUP_MIN_PADDING = 32;
const GROUP_PADDING_DECAY_PER_LEVEL = 16;
const GROUP_BASE_ALPHA = 0.22;
const GROUP_ALPHA_DECAY_PER_LEVEL = 0.05;
const GROUP_MIN_ALPHA = 0.08;
const EXTRA_NODE_OFFSET = 80;
const EXTRA_NODE_GAP = 20;
const getGroupPadding = (basePadding: number, level: number) =>
  Math.max(
    GROUP_MIN_PADDING,
    basePadding - level * GROUP_PADDING_DECAY_PER_LEVEL,
  );
const getGroupBackgroundAlpha = (level: number) =>
  Math.max(
    GROUP_MIN_ALPHA,
    GROUP_BASE_ALPHA - level * GROUP_ALPHA_DECAY_PER_LEVEL,
  );

type LayoutContext = {
  config?: INodeConfig;
};

const getNodeDimensions = (nodeType: ENodeType, config?: INodeConfig) =>
  config?.dimensions?.[nodeType] || { height: 0, width: 0 };
const isHorizontalDirection = (ctx: LayoutContext) =>
  (ctx.config?.direction ?? "horizontal") === "horizontal";
const isAttachmentEdge = (edge: Edge) =>
  isAttachmentSourceHandle(edge.sourceHandle);
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
  handleId: WorkflowPort;
  elkId: string;
  side: string;
  type: EHandleType;
};

const toElk = (nodes: GraphNode[], edges: Edge[], ctx: LayoutContext) => {
  const isVertical = !isHorizontalDirection(ctx);
  const direction = ctx.config?.direction ?? "horizontal";
  const elkDirection = isVertical ? "DOWN" : "RIGHT";
  const nodeIds = new Set(nodes.map((node) => node.id));
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const nodeDimensions = new Map(
    nodes.map((node) => [node.id, getNodeDimensions(node.type, ctx.config)]),
  );
  const nodePorts = new Map<string, ElkPort[]>();

  if (!isVertical) {
    const attachmentTargetsBySource = edges.reduce((acc, edge) => {
      if (!isAttachmentEdge(edge)) {
        return acc;
      }

      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);

      if (!sourceNode || !targetNode) {
        return acc;
      }

      acc.set(edge.source, [...(acc.get(edge.source) ?? []), targetNode]);

      return acc;
    }, new Map<string, GraphNode[]>());

    attachmentTargetsBySource.forEach((targets, sourceId) => {
      if (!targets.length) {
        return;
      }

      const sourceNode = nodeMap.get(sourceId);

      if (!sourceNode) {
        return;
      }

      const sourceDimensions =
        nodeDimensions.get(sourceId) ??
        getNodeDimensions(sourceNode.type, ctx.config);
      const maxAttachmentHeight = Math.max(
        ...targets.map((target) => {
          const dimensions =
            nodeDimensions.get(target.id) ??
            getNodeDimensions(target.type, ctx.config);

          return dimensions.height;
        }),
      );

      nodeDimensions.set(sourceId, {
        ...sourceDimensions,
        height:
          sourceDimensions.height + EXTRA_NODE_OFFSET + maxAttachmentHeight,
      });
    });
  }

  const resolvePort = (
    ports: ElkPort[] | undefined,
    preferredHandle?: string | null,
    preferredType?: EHandleType,
  ) => {
    if (!ports?.length) {
      return;
    }

    if (preferredHandle) {
      const handlePort = ports.find((port) => port.handleId === preferredHandle);

      if (handlePort) {
        return handlePort.elkId;
      }
    }

    if (preferredType) {
      const typedPort = ports.find((port) => port.type === preferredType);

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
      "elk.spacing.nodeNode": "64",
      "elk.layered.spacing.nodeNodeBetweenLayers": "186",
      "org.eclipse.elk.layered.considerModelOrder.strategy": "PREFER_NODES",
      "org.eclipse.elk.layered.crossingMinimization.forceNodeModelOrder":
        "true",
      "org.eclipse.elk.layered.considerModelOrder.crossingCounterNodeInfluence":
        "0.001",
      "org.eclipse.elk.randomSeed": "1",
    },
    children: nodes.map((node) => {
      const ports =
        (node.data as { ports?: WorkflowNodePort<ENodeType>[] })?.ports?.map(
          (portDef) => {
            const handleId = getWorkflowPortId(portDef);
            const portRule = resolveWorkflowPortRule(handleId, direction);

            return {
              handleId,
              elkId: `${node.id}__${handleId}`,
              side: getElkSide(portRule.position),
              type: portRule.type,
            } as ElkPort;
          },
        ) ?? [];

      nodePorts.set(node.id, ports);

      const dimensions =
        nodeDimensions.get(node.id) ?? getNodeDimensions(node.type, ctx.config);

      return {
        id: node.id,
        ...dimensions,
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
      .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
      .map((edge) => {
        return {
          id: edge.id,
          sources: [
            resolvePort(
              nodePorts.get(edge.source),
              edge.sourceHandle,
              EHandleType.SOURCE,
            ) ?? `${edge.source}__out`,
          ],
          targets: [
            resolvePort(
              nodePorts.get(edge.target),
              edge.targetHandle,
              EHandleType.TARGET,
            ) ?? `${edge.target}__in`,
          ],
        };
      }),
  };
};
const layoutNodesWithElk = async (
  nodes: GraphNode[],
  edges: Edge[],
  ctx: LayoutContext,
) => {
  const graph = await elk.layout(toElk(nodes, edges, ctx));
  const positions = new Map<string, { x: number; y: number }>();

  graph.children?.forEach((child: any) =>
    positions.set(child.id, { x: child.x, y: child.y }),
  );

  return nodes.map((node) => ({
    ...node,
    position: positions.get(node.id) ?? node.position,
  }));
};
const addExtraNodes = (
  nodes: GraphNode[],
  edges: Edge[],
  ctx: LayoutContext,
) => {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const isHorizontal = isHorizontalDirection(ctx);
  const adjacencyMap = edges.reduce((acc, { source, target }) => {
    const sourceNode = nodesById.get(source);
    const targetNode = nodesById.get(target);

    if (sourceNode && targetNode) {
      acc.set(source, [...(acc.get(source) || []), targetNode]);
    }

    return acc;
  }, new Map<string, GraphNode[]>());

  if (adjacencyMap.size === 0) {
    return nodes;
  }

  const overrides = new Map<
    string,
    Pick<GraphNode, "position" | "targetPosition" | "sourcePosition">
  >();

  adjacencyMap.forEach((targets, sourceId) => {
    const sourceNode = nodesById.get(sourceId);

    if (!sourceNode) {
      return;
    }

    const sourceDimensions = getNodeDimensions(sourceNode.type, ctx.config);
    const targetsWithDimensions = targets.map((target) => ({
      node: target,
      dimensions: getNodeDimensions(target.type, ctx.config),
    }));
    const totalBreadth =
      targetsWithDimensions.reduce(
        (sum, target) =>
          sum + (isHorizontal ? target.dimensions.width : target.dimensions.height),
        0,
      ) +
      EXTRA_NODE_GAP * (targets.length - 1);

    let cursor = isHorizontal
      ? sourceNode.position.x + (sourceDimensions.width - totalBreadth) / 2
      : sourceNode.position.y + (sourceDimensions.height - totalBreadth) / 2;

    targetsWithDimensions.forEach(({ node, dimensions }) => {
      overrides.set(node.id, {
        position: isHorizontal
          ? {
              x: cursor,
              y: sourceNode.position.y + sourceDimensions.height + EXTRA_NODE_OFFSET,
            }
          : {
              x: sourceNode.position.x - EXTRA_NODE_OFFSET - dimensions.width,
              y: cursor,
            },
        targetPosition: isHorizontal ? Position.Top : Position.Right,
        sourcePosition: isHorizontal ? Position.Bottom : Position.Left,
      });
      cursor += (isHorizontal ? dimensions.width : dimensions.height) + EXTRA_NODE_GAP;
    });
  });

  return nodes.map((node) => ({
    ...node,
    ...overrides.get(node.id),
  }));
};
const getGroupNodes = (
  nodes: GraphNode[],
  groups: Map<string, GroupMeta>,
  config: INodeConfig,
) => {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const groupNodes: GraphNode<ENodeType.GROUP>[] = [];

  groups.forEach((group) => {
    const groupMembers = [...group.memberNodeIds]
      .map((nodeId) => nodesById.get(nodeId))
      .filter((node): node is GraphNode => Boolean(node));

    if (!groupMembers.length) {
      return;
    }

    const color = config.highlights?.[group.operatorType]?.color;
    const basePadding = config.highlights?.[group.operatorType]?.padding || 0;
    const padding = getGroupPadding(basePadding, group.level);
    const backgroundAlpha = getGroupBackgroundAlpha(group.level);
    const bounds = getNodesBounds(groupMembers);

    groupNodes.push({
      ...DEFAULT_NODE_PROPS,
      id: group.id,
      type: ENodeType.GROUP,
      position: {
        x: bounds.x - padding / 2,
        y: bounds.y - padding / 2,
      },
      data: config.nodes[ENodeType.GROUP],
      style: {
        width: bounds.width + padding,
        height: bounds.height + padding,
        zIndex: -1,
        borderRadius: "1rem",
        backgroundColor: color ? withAlpha(color, backgroundAlpha) : undefined,
        border: `1px solid ${withAlpha("#0004", backgroundAlpha)}`,
      },
    });
  });

  return groupNodes;
};

export const buildNodesAndEdges = async ({
  config,
  flow,
  tasks,
  actionCatalog,
  bindingCatalog,
}: IBuildNodesAndEdgesProps): Promise<
  { nodes: GraphNode[]; edges: Edge[] } | undefined
> => {
  if (!flow?.length) {
    return;
  }

  const traversal = traverseWorkflow({
    flow,
    config,
    tasks,
    actionCatalog,
    bindingCatalog,
  });

  decorateSemanticGraph(traversal.registry);

  const projected = projectSemanticGraph(traversal.registry, config);
  const elkNodes = await layoutNodesWithElk(projected.nodes, projected.edges, {
    config,
  });
  const positionedNodes = addExtraNodes(
    elkNodes,
    projected.edges.filter(isAttachmentEdge),
    {
      config,
    },
  );
  const groupNodes = getGroupNodes(positionedNodes, traversal.groups, config);

  return {
    edges: projected.edges,
    nodes: [...groupNodes, ...positionedNodes],
  };
};

export const getWorkflowDefaultConfig = (direction?: ResizeControlDirection) =>
  ({
    direction,
    dimensions: NODE_DIMENSIONS,
    highlights: OPERATOR_HIGHLIGHTS,
    edges: EDGE_STYLES,
    nodes: NODE_DEFINITIONS,
  }) satisfies INodeConfig;
