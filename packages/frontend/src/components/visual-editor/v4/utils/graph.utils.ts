/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  ConditionalBlock,
  ConditionalBranch,
  FlowStep,
  WorkflowDefinition,
} from "@hexabot-ai/agentic";
import { type Edge } from "@xyflow/react";
import type { ResizeControlDirection } from "@xyflow/system";

import { generateId } from "@/utils/generateId";

import {
  DEFAULT_NODE_PROPS,
  DIMENSIONS,
  EDGES,
  HIGHLIGHTS,
  NODES,
} from "../constants/workflow.constants";
import {
  EEdgeType,
  EIndicatorType,
  ELinkType,
  ENodeType,
  EOperatorType,
  type INodeConfig,
  type NodeData,
  type THighlightGroups,
} from "../types/workflow-node.types";

export const getNodeDimensions = (nodeType: ENodeType, config?: INodeConfig) =>
  config?.dimensions?.[nodeType] || { height: 0, width: 0 };

export function humanizeTaskName(name: string) {
  if (!name) return "Task";
  const withSpaces = name.replace(/_/g, " ");

  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

export type TraversalContext = {
  tasks: WorkflowDefinition["tasks"];
  nodes: NodeData[];
  edges: Edge[];
  edgeKeys: Set<string>;
  config?: INodeConfig;
};

type WalkArgs = {
  index: number;
  steps?: FlowStep[];
  tasks: WorkflowDefinition["tasks"];
  level: number;
  prefix: string;
  incoming: string[];
  ctx: TraversalContext;
  nodeType?: EOperatorType;
};

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids));
}

function collectConditionalBranches(
  conditional?: ConditionalBlock,
): FlowStep[][] {
  if (!conditional) return [];

  const branches: FlowStep[][] = [];

  conditional.when?.forEach((branch: ConditionalBranch) => {
    const steps =
      "condition" in branch
        ? branch.steps
        : "else" in branch
          ? branch.steps
          : undefined;

    if (Array.isArray(steps) && steps.length > 0) branches.push(steps);
  });

  return branches;
}

const addGroupEdge = (
  ctx: TraversalContext,
  source: string,
  target: string,
  label?: string,
) => {
  const sourceGroupName = getGroupId(source, ctx.config?.highlights);
  const targetGroupName = getGroupId(target, ctx.config?.highlights);

  if (sourceGroupName !== targetGroupName) {
    if (!sourceGroupName && targetGroupName) {
      // task -> group
      const id = `e-${source}-${targetGroupName}`;

      if (ctx.edges.findIndex((e) => e.id === id) === -1) {
        ctx.edges.push({
          id,
          type: EEdgeType.EDGE_WITH_BUTTON,
          ...ctx.config?.edges?.[EEdgeType.EDGE_WITH_BUTTON],
          source,
          target: targetGroupName,
          label,
        });
      }
    } else if (sourceGroupName && targetGroupName) {
      // group -> other group
      const id = `e-${sourceGroupName}-${targetGroupName}`;

      if (ctx.edges.findIndex((e) => e.id === id) === -1) {
        ctx.edges.push({
          id,
          type: EEdgeType.EDGE_WITH_BUTTON,
          ...ctx.config?.edges?.[EEdgeType.EDGE_WITH_BUTTON],
          source: sourceGroupName,
          target: targetGroupName,
          label,
        });
      }
    } else if (sourceGroupName && !targetGroupName) {
      // group -> task
      const id = `e-${sourceGroupName}-${target}`;

      if (ctx.edges.findIndex((e) => e.id === id) === -1) {
        ctx.edges.push({
          id,
          type: EEdgeType.EDGE_WITH_BUTTON,
          ...ctx.config?.edges?.[EEdgeType.EDGE_WITH_BUTTON],
          source: sourceGroupName,
          target,
          label,
        });
      }
    }
  }
};

function addEdge(
  ctx: TraversalContext,
  source: string,
  target: string,
  sourceHandle?: string,
  label?: string,
) {
  addGroupEdge(ctx, source, target, label);

  ctx.edges.push({
    id: `e-${source}-${target}`,
    type: EEdgeType.EDGE_WITH_BUTTON,
    ...ctx.config?.edges?.[EEdgeType.EDGE_WITH_BUTTON],
    source,
    target,
    label,
    sourceHandle,
  });
}

export const getTaskDescription = (
  taskName: string,
  tasks: WorkflowDefinition["tasks"],
) => {
  return tasks?.[taskName]?.description ?? "No description provided.";
};

export const getTaskAction = (
  taskName: string,
  tasks: WorkflowDefinition["tasks"],
) => {
  return tasks?.[taskName]?.action ?? "No action provided.";
};

export const getGroupId = (id: string, groups?: THighlightGroups) => {
  const groupId = id.match(/step-[\d]-(conditional|loop|parallel)/g)?.[0];

  if (groupId) {
    const [, , operator] = groupId.split("-");

    if (groups?.[operator]) {
      return `${ENodeType.GROUP}-${groupId}`;
    }
  }
};

const getIndicator = <T extends EIndicatorType>(
  type: T,
  id: string,
  ctx: TraversalContext,
  level?: WalkArgs["level"],
  groupName?: string,
) => {
  if (!ctx.config) {
    return;
  }

  return {
    ...getNodeDimensions(ENodeType.INDICATOR, ctx.config),
    ...DEFAULT_NODE_PROPS,
    id: `${EIndicatorType.START}-${id}`,
    type: ENodeType.INDICATOR,
    position: { x: 0, y: 0 },
    data: {
      ...ctx.config.nodes[ENodeType.INDICATOR][type],
      level,
      groupName,
    },
  } satisfies NodeData<ENodeType.INDICATOR>;
};
const getIndicatorEdge = <T extends EIndicatorType>(
  type: T,
  ctx: TraversalContext,
  target: string,
) => {
  return {
    id: generateId(),
    source: `${type}-${target}`,
    target,
    type: EEdgeType.EDGE_WITH_BUTTON,
    ...ctx.config?.edges?.[EEdgeType.EDGE_WITH_BUTTON],
  };
};

export function walkSteps({
  steps,
  tasks,
  level,
  prefix,
  incoming,
  ctx,
}: WalkArgs): string[] {
  if (!Array.isArray(steps) || steps.length === 0) {
    return uniqueIds(incoming);
  }

  let currentSources = uniqueIds(incoming);

  steps.forEach((step, index) => {
    if (!ctx.config) {
      return;
    }

    const idBase = `${prefix}-${index}`;

    if ("do" in step && step.do) {
      const taskName = step.do;
      const taskNodeId = `${idBase}-${taskName}`;
      const groupName = getGroupId(taskNodeId, ctx.config.highlights);

      if (!ctx.nodes.length) {
        const startIndicator = getIndicator(
          EIndicatorType.START,
          taskNodeId,
          ctx,
          level,
          groupName,
        );

        if (startIndicator) {
          ctx.nodes.push(startIndicator);
        }
      }

      if (!incoming.length) {
        const startIndicatorEdge = getIndicatorEdge(
          EIndicatorType.START,
          ctx,
          taskNodeId,
        );

        ctx.edges.push(startIndicatorEdge);
      }

      const task = tasks[taskName];
      const tools: string[] = task.settings?.["tools"] || [];

      if (tools.length) {
        ctx.nodes.push({
          ...getNodeDimensions(ENodeType.AGENT, ctx.config),
          ...DEFAULT_NODE_PROPS,
          selectable: true,
          id: taskNodeId,
          type: ENodeType.AGENT,
          position: { x: 0, y: 0 },
          data: {
            description: getTaskDescription(step["do"], tasks),
            ...ctx.config.nodes[ENodeType.AGENT],
            level,
            groupName,
            title: taskName,
            i18nTitle: undefined,
          },
        });

        const model: string = task.settings?.["model"] || "";

        if (model) {
          ctx.nodes.push({
            ...getNodeDimensions(ENodeType.MODEL, ctx.config),
            ...DEFAULT_NODE_PROPS,
            id: `model-${taskNodeId}`,
            type: ENodeType.MODEL,
            position: { x: 0, y: 0 },
            data: {
              ...ctx.config.nodes[ENodeType.MODEL],
              title: model,
              i18nTitle: undefined,
              level,
            },
          });

          addEdge(
            ctx,
            taskNodeId,
            `model-${taskNodeId}`,
            ELinkType.AGENT_MODEL,
          );
        }

        tools.forEach((tool) => {
          const toolId = `tool-${tool}`;

          if (!ctx.config) {
            return;
          }

          ctx.nodes.push({
            ...getNodeDimensions(ENodeType.TOOL, ctx.config),
            ...DEFAULT_NODE_PROPS,
            id: toolId,
            type: ENodeType.TOOL,
            position: { x: 0, y: 0 },
            data: {
              ...ctx.config.nodes[ENodeType.TOOL],
              title: tool,
              i18nTitle: undefined,
              level,
            },
          });

          addEdge(ctx, taskNodeId, toolId, ELinkType.AGENT_TOOL);
        });
      } else {
        ctx.nodes.push({
          ...getNodeDimensions(ENodeType.TASK, ctx.config),
          ...DEFAULT_NODE_PROPS,
          selectable: true,
          id: taskNodeId,
          type: ENodeType.TASK,
          position: { x: 0, y: 0 },
          data: {
            ...ctx.config.nodes[ENodeType.TASK](taskNodeId, step, tasks),
            level,
            groupName,
          },
        });
      }

      currentSources.forEach((source) => addEdge(ctx, source, taskNodeId));
      currentSources = [taskNodeId];

      return;
    }

    if ("parallel" in step && step.parallel?.steps) {
      const parallelNodeId = `${idBase}-parallel`;
      const groupName = getGroupId(parallelNodeId, ctx.config.highlights);

      ctx.nodes.push({
        ...getNodeDimensions(ENodeType.OPERATOR, ctx.config),
        ...DEFAULT_NODE_PROPS,
        id: parallelNodeId,
        type: ENodeType.OPERATOR,
        position: { x: 0, y: 0 },
        data: {
          ...ctx.config.nodes[ENodeType.OPERATOR][EOperatorType.PARALLEL],
          level,
          groupName,
        },
      });

      currentSources.forEach((source) => addEdge(ctx, source, parallelNodeId));

      const exits = step.parallel.steps.flatMap((branchStep, branchIndex) =>
        walkSteps({
          index,
          steps: [branchStep],
          tasks,
          level: level + 1,
          prefix: `${parallelNodeId}${branchIndex}`,
          incoming: [parallelNodeId],
          ctx,
        }),
      );

      currentSources = uniqueIds(exits.length ? exits : currentSources);

      return;
    }

    if ("conditional" in step && step.conditional) {
      const conditionalNodeId = `${idBase}-conditional`;
      const groupName = getGroupId(conditionalNodeId, ctx.config.highlights);

      ctx.nodes.push({
        ...getNodeDimensions(ENodeType.OPERATOR, ctx.config),
        ...DEFAULT_NODE_PROPS,
        id: conditionalNodeId,
        type: ENodeType.OPERATOR,
        position: { x: 0, y: 0 },
        data: {
          ...ctx.config.nodes[ENodeType.OPERATOR][EOperatorType.CONDITIONAL],
          level,
          groupName,
        },
      });

      currentSources.forEach((source) =>
        addEdge(ctx, source, conditionalNodeId),
      );

      const exits = collectConditionalBranches(step.conditional).flatMap(
        (branchSteps, branchIndex) =>
          walkSteps({
            index,
            steps: branchSteps,
            tasks,
            level: level + 1,
            prefix: `${conditionalNodeId}${branchIndex}`,
            incoming: [conditionalNodeId],
            ctx,
          }),
      );

      currentSources = uniqueIds(exits.length ? exits : currentSources);

      return;
    }

    if ("loop" in step && step.loop?.steps) {
      const loopNodeId = `${idBase}-loop`;
      const groupName = getGroupId(loopNodeId, ctx.config.highlights);

      ctx.nodes.push({
        ...getNodeDimensions(ENodeType.OPERATOR, ctx.config),
        ...DEFAULT_NODE_PROPS,
        id: loopNodeId,
        type: ENodeType.OPERATOR,
        position: { x: 0, y: 0 },
        data: {
          ...ctx.config.nodes[ENodeType.OPERATOR][EOperatorType.LOOP],
          level,
          groupName,
        },
      });

      currentSources.forEach((source) => addEdge(ctx, source, loopNodeId));

      const exits = walkSteps({
        index,
        steps: step.loop.steps,
        tasks,
        level: level + 1,
        prefix: loopNodeId,
        incoming: [loopNodeId],
        ctx,
      });

      currentSources = uniqueIds(exits.length ? exits : currentSources);
    }
  });

  return uniqueIds(currentSources);
}

export const getWorkflowDefaultConfig = (direction?: ResizeControlDirection) =>
  ({
    direction,
    dimensions: DIMENSIONS,
    highlights: HIGHLIGHTS,
    edges: EDGES,
    nodes: NODES,
  }) satisfies INodeConfig;
