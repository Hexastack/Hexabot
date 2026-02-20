/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  CompiledStep,
  compileWorkflow,
  validateWorkflow,
  type WorkflowCompileOptions,
  type WorkflowDefinition,
} from "@hexabot-ai/agentic";
import { alpha } from "@mui/material/styles";
import { getNodesBounds, Position, type Edge } from "@xyflow/react";
import ELK from "elkjs/lib/elk.bundled.js";

import { DEFAULT_NODE_PROPS } from "@/constants/workflow.constants";

import {
  EEdgeType,
  EHandleType,
  EIndicatorType,
  ELinkType,
  ENodeType,
  getWorkflowPortId,
  type GraphNode,
  type IBuildNodesAndEdgesProps,
  type WorkflowNodePort,
  type WorkflowPort,
} from "../types/workflow-node.types";
import type { FlowStepPath } from "../types/workflow-path.types";

import {
  getGroupId,
  getNodeDimensions,
  walkSteps,
  type TraversalContext,
} from "./graph.utils";
import { getHandleConfig } from "./handle.utils";

const elk = new ELK();
const GROUP_MIN_PADDING = 32;
const GROUP_PADDING_DECAY_PER_LEVEL = 16;
const GROUP_BASE_ALPHA = 0.22;
const GROUP_ALPHA_DECAY_PER_LEVEL = 0.05;
const GROUP_MIN_ALPHA = 0.08;
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

const toElk = (nodes: GraphNode[], edges: Edge[], ctx: TraversalContext) => {
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
      "elk.spacing.nodeNode": "64",
      "elk.layered.spacing.nodeNodeBetweenLayers": "186",
      "org.eclipse.elk.layered.considerModelOrder.strategy": "PREFER_NODES",
      "org.eclipse.elk.layered.crossingMinimization.forceNodeModelOrder":
        "true",
      "org.eclipse.elk.layered.considerModelOrder.crossingCounterNodeInfluence":
        "0.001",
      "org.eclipse.elk.randomSeed": "1",
    },
    children: nodes.map((n) => {
      const ports =
        (n.data as { ports?: WorkflowNodePort<ENodeType>[] })?.ports?.map(
          (portDef) => {
            const handleId = getWorkflowPortId(portDef);
            const handle = getHandleConfig(handleId, direction);

            return {
              handleId,
              elkId: `${n.id}__${handleId}`,
              side: getElkSide(handle.position),
              type: handle.type,
            } as ElkPort;
          },
        ) ?? [];

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
  nodes: GraphNode[],
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

const addExtraNodes = (
  nodes: GraphNode[],
  edges: Edge[],
  ctx: TraversalContext,
) => {
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const isHorizontal = ctx.config?.direction === "horizontal";
  const OFFSET = 80;
  const GAP = 20;
  const adjacencyMap = edges.reduce((acc, { source, target }) => {
    const src = nodesById.get(source);
    const tgt = nodesById.get(target);

    if (src && tgt) {
      acc.set(source, [...(acc.get(source) || []), tgt]);
    }

    return acc;
  }, new Map<string, GraphNode[]>());

  if (adjacencyMap.size === 0) return nodes;

  const overrides = new Map<
    string,
    Pick<GraphNode, "position" | "targetPosition" | "sourcePosition">
  >();

  adjacencyMap.forEach((targets, sourceId) => {
    const sourceNode = nodesById.get(sourceId)!;
    const srcDim = getNodeDimensions(sourceNode.type, ctx.config);
    const targetsWithDim = targets.map((t) => ({
      node: t,
      dim: getNodeDimensions(t.type, ctx.config),
    }));
    const totalBreadth =
      targetsWithDim.reduce(
        (sum, t) => sum + (isHorizontal ? t.dim.width : t.dim.height),
        0,
      ) +
      GAP * (targets.length - 1);

    let currentCursor = isHorizontal
      ? sourceNode.position.x + (srcDim.width - totalBreadth) / 2
      : sourceNode.position.y + (srcDim.height - totalBreadth) / 2;

    targetsWithDim.forEach(({ node, dim }) => {
      overrides.set(node.id, {
        position: isHorizontal
          ? {
              x: currentCursor,
              y: sourceNode.position.y + srcDim.height + OFFSET,
            }
          : { x: sourceNode.position.x - OFFSET - dim.width, y: currentCursor },
        targetPosition: isHorizontal ? Position.Top : Position.Right,
        sourcePosition: isHorizontal ? Position.Bottom : Position.Left,
      });
      currentCursor += (isHorizontal ? dim.width : dim.height) + GAP;
    });
  });

  return nodes.map((n) => ({ ...n, ...overrides.get(n.id) }));
};

export const getGroupNodes = (nodes: GraphNode[], ctx: TraversalContext) => {
  const groups: GraphNode<ENodeType.GROUP>[] = [];

  (nodes as GraphNode<ENodeType.OPERATOR>[])
    .filter(
      ({ data }) =>
        data.operatorType &&
        ctx.config?.highlights?.[data.operatorType],
    )
    .forEach((n) => {
      if (!ctx.config) {
        return;
      }
      const groupId = n.id;
      const groupNodeId =
        n.data.groupName || getGroupId(groupId, ctx.config.highlights);

      if (!groupNodeId) {
        return;
      }
      const color =
        n.data.operatorType &&
        ctx.config?.highlights?.[n.data.operatorType]?.color;
      const basePadding =
        (n.data.operatorType &&
          ctx.config?.highlights?.[n.data.operatorType]?.padding) ||
        0;
      const level = n.data.level || 0;
      const padding = getGroupPadding(basePadding, level);
      const backgroundAlpha = getGroupBackgroundAlpha(level);
      const groupNodes = nodes.filter((n) => n.id.startsWith(groupId));
      const groupBounds = getNodesBounds(groupNodes);

      groups.push({
        ...DEFAULT_NODE_PROPS,
        id: groupNodeId,
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
          borderRadius: "1rem",
          backgroundColor: color ? alpha(color, backgroundAlpha) : undefined,
          border: `1px solid ${alpha("#0004", backgroundAlpha)}`,
        },
      });
    });

  return groups;
};

export const buildNodesAndEdges = async ({
  config,
  flow,
  tasks,
  memoryDefinitions,
}: IBuildNodesAndEdgesProps): Promise<
  { nodes: GraphNode[]; edges: Edge[] } | undefined
> => {
  if (!flow?.length) return;
  const ctx: TraversalContext = {
    tasks,
    memoryDefinitions,
    nodes: [],
    edges: [],
    nodePaths: new Map(),
    placeholderNodeIds: new Set(),
    config,
  };
  const endStepIds = walkSteps({
    steps: flow,
    level: 0,
    prefix: "step",
    incoming: [],
    ctx,
    path: ["flow"],
  });

  if (!ctx.config) {
    return { nodes: [], edges: [] };
  }

  const endIndicatorId = `${EIndicatorType.WORKFLOW_END}-${endStepIds.at(-1)}`;

  ctx.nodes.push({
    ...getNodeDimensions(ENodeType.INDICATOR, ctx.config),
    ...DEFAULT_NODE_PROPS,
    id: endIndicatorId,
    type: ENodeType.INDICATOR,
    position: { x: 0, y: 0 },
    data: {
      ...ctx.config?.nodes[ENodeType.INDICATOR][EIndicatorType.WORKFLOW_END],
      indicator: EIndicatorType.WORKFLOW_END,
    },
  });

  endStepIds.forEach((endEdgesId) => {
    const isFromBranchPlaceholder = ctx.placeholderNodeIds.has(endEdgesId);
    const groupName = getGroupId(endEdgesId, ctx.config?.highlights);
    const groupPrefix = `${ENodeType.GROUP}-`;
    const groupStepId =
      groupName && groupName.startsWith(groupPrefix)
        ? groupName.slice(groupPrefix.length)
        : undefined;
    const sourcePath = ctx.nodePaths.get(endEdgesId);
    const baseInsertPath =
      groupStepId && ctx.nodePaths.has(groupStepId)
        ? ctx.nodePaths.get(groupStepId)
        : sourcePath;
    const lastIndex = baseInsertPath?.[baseInsertPath.length - 1];
    const insertPath =
      baseInsertPath && typeof lastIndex === "number"
        ? [...baseInsertPath.slice(0, -1), lastIndex + 1]
        : undefined;
    const directEdgeInsertPath = groupName ? undefined : insertPath;

    ctx.edges.push({
      id: `e-${endEdgesId}-${endIndicatorId}`,
      source: endEdgesId,
      target: endIndicatorId,
      type: EEdgeType.EDGE_WITH_BUTTON,
      ...ctx.config?.edges?.[EEdgeType.EDGE_WITH_BUTTON],
      hidden: isFromBranchPlaceholder,
      data: directEdgeInsertPath
        ? { insertPath: directEdgeInsertPath }
        : undefined,
    });

    if (groupName) {
      const groupToEndId = `e-${groupName}-${endIndicatorId}`;
      const existingGroupEdge = ctx.edges.find((edge) => edge.id === groupToEndId);

      if (existingGroupEdge) {
        const edgeData = existingGroupEdge.data as
          | { insertPath?: FlowStepPath }
          | undefined;

        if (!edgeData?.insertPath && insertPath) {
          existingGroupEdge.data = { ...(edgeData || {}), insertPath };
        }
      } else {
        ctx.edges.push({
          id: groupToEndId,
          source: groupName,
          target: endIndicatorId,
          type: EEdgeType.EDGE_WITH_BUTTON,
          ...ctx.config?.edges?.[EEdgeType.EDGE_WITH_BUTTON],
          data: insertPath ? { insertPath } : undefined,
        });
      }
    }
  });
  const elkNodes = await layoutNodesWithElk(ctx.nodes, ctx.edges, ctx);
  const nodes = addExtraNodes(
    elkNodes,
    ctx.edges.filter((e) =>
      [
        ELinkType.AGENT_TOOL,
        ELinkType.AGENT_MODEL,
        ELinkType.AGENT_MEMORY,
      ].includes(e.sourceHandle as ELinkType),
    ),
    ctx,
  );
  const groupNodes = getGroupNodes(nodes, ctx);
  const anchoredNodes = [...groupNodes, ...nodes];

  return {
    edges: ctx.edges,
    nodes: anchoredNodes,
  };
};

export const getDefinition = (
  yaml: string,
  options: WorkflowCompileOptions,
): { definition: WorkflowDefinition; flow: CompiledStep[] } => {
  const validation = validateWorkflow(yaml);

  if (!validation.success) {
    throw new Error(
      `Workflow validation failed: ${validation.errors.join("; ")}`,
    );
  }
  const { definition, flow } = compileWorkflow(validation.data, options);

  return { definition, flow };
};
