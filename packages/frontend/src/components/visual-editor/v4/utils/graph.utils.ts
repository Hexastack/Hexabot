/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  StepType,
  type CompiledConditionalStep,
  type CompiledLoopStep,
  type CompiledParallelStep,
  type CompiledStep,
  type TaskDefinitions,
} from "@hexabot-ai/agentic";
import { type Edge } from "@xyflow/react";
import type { ResizeControlDirection } from "@xyflow/system";

import {
  DEFAULT_NODE_PROPS,
  DIMENSIONS,
  EDGES,
  HIGHLIGHTS,
  NODES,
} from "@/constants/workflow.constants";
import { IMemoryDefinition } from "@/types/memory-definition.types";

import {
  EEdgeType,
  EIndicatorType,
  ELinkType,
  ENodeType,
  type EOperatorType,
  type GraphNode,
  type INodeConfig,
  type THighlightGroups,
} from "../types/workflow-node.types";
import type { FlowStepPath } from "../types/workflow-path.types";

export const getNodeDimensions = (nodeType: ENodeType, config?: INodeConfig) =>
  config?.dimensions?.[nodeType] || { height: 0, width: 0 };

export function humanizeTaskName(name: string) {
  if (!name) return "Task";
  const withSpaces = name.replace(/_/g, " ");

  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

export type TraversalContext = {
  memoryDefinitions: IMemoryDefinition[];
  tasks?: TaskDefinitions;
  nodes: GraphNode[];
  edges: Edge[];
  nodePaths: Map<string, FlowStepPath>;
  placeholderNodeIds: Set<string>;
  config?: INodeConfig;
};

type WalkArgs = {
  steps?: CompiledStep[];
  level: number;
  prefix: string;
  incoming: string[];
  ctx: TraversalContext;
  path: FlowStepPath;
  entryEdgeLabel?: string;
};

type TaskNodeArgs = {
  taskNodeId: string;
  taskName: string;
  stepId: string;
  level: number;
  groupName?: string;
  stepPath: FlowStepPath;
};

type OperatorNodeArgs = {
  operatorNodeId: string;
  operatorType: EOperatorType;
  stepId: string;
  level: number;
  groupName?: string;
  stepPath: FlowStepPath;
  strategy?: CompiledParallelStep["strategy"];
};

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids));
}

// Create a step path that keeps insert positions stable for nested flows.
const buildStepPath = (
  path: FlowStepPath,
  index: number,
  pathIndex?: number,
): FlowStepPath => [...path, pathIndex ?? index];
// Normalize task settings once to avoid repeated lookups.
const getTaskMeta = (taskName: string, tasks?: TaskDefinitions) => {
  const settings = tasks?.[taskName]?.settings as Record<string, unknown> | undefined;
  const tools = Array.isArray(settings?.tools)
    ? (settings.tools as string[])
    : [];
  const modelValue = settings?.model;
  const model =
    modelValue !== undefined && modelValue !== null ? String(modelValue) : "";

  return { settings, tools, model };
};
// Connect incoming sources to a target and preserve insert path metadata.
const connectIncomingEdges = (
  ctx: TraversalContext,
  incoming: string[],
  target: string,
  insertPath?: FlowStepPath,
  label?: string,
) => {
  incoming.forEach((source, index) => {
    const edgeLabel = index === 0 ? label : undefined;

    addEdge(ctx, source, target, undefined, edgeLabel, insertPath);
  });
};
const addGroupEdge = (
  ctx: TraversalContext,
  source: string,
  target: string,
  label?: string,
  insertPath?: FlowStepPath,
) => {
  const sourceGroupName = getGroupId(source, ctx.config?.highlights);
  const targetGroupName = getGroupId(target, ctx.config?.highlights);

  if (sourceGroupName === targetGroupName) {
    return false;
  }

  const upsertGroupEdge = (
    id: string,
    groupSource: string,
    groupTarget: string,
  ) => {
    const existingEdge = ctx.edges.find((e) => e.id === id);

    if (existingEdge) {
      const edgeData = existingEdge.data as { insertPath?: FlowStepPath } | undefined;

      if (!edgeData?.insertPath && insertPath) {
        existingEdge.data = { ...(edgeData || {}), insertPath };
      }

      if (label && !existingEdge.label) {
        existingEdge.label = label;
      }

      return true;
    }

    ctx.edges.push({
      id,
      type: EEdgeType.EDGE_WITH_BUTTON,
      ...ctx.config?.edges?.[EEdgeType.EDGE_WITH_BUTTON],
      source: groupSource,
      target: groupTarget,
      label,
      data: insertPath ? { insertPath } : undefined,
    });

    return true;
  };

  if (!sourceGroupName && targetGroupName) {
    // task -> group
    return upsertGroupEdge(`e-${source}-${targetGroupName}`, source, targetGroupName);
  }

  if (sourceGroupName && targetGroupName) {
    // group -> other group
    return upsertGroupEdge(
      `e-${sourceGroupName}-${targetGroupName}`,
      sourceGroupName,
      targetGroupName,
    );
  }

  if (sourceGroupName && !targetGroupName) {
    // group -> task
    return upsertGroupEdge(`e-${sourceGroupName}-${target}`, sourceGroupName, target);
  }

  return false;
};

function addEdge(
  ctx: TraversalContext,
  source: string,
  target: string,
  sourceHandle?: string,
  label?: string,
  insertPath?: FlowStepPath,
) {
  const hasGroupEdge = addGroupEdge(ctx, source, target, label, insertPath);
  const edgeInsertPath = hasGroupEdge ? undefined : insertPath;
  const isFromBranchPlaceholder = ctx.placeholderNodeIds.has(source);
  const isToBranchPlaceholder = ctx.placeholderNodeIds.has(target);
  const shouldHideDirectEdge =
    hasGroupEdge ||
    (isFromBranchPlaceholder && !isToBranchPlaceholder);

  ctx.edges.push({
    id: `e-${source}-${target}`,
    type: EEdgeType.EDGE_WITH_BUTTON,
    ...ctx.config?.edges?.[EEdgeType.EDGE_WITH_BUTTON],
    source,
    target,
    label,
    hidden: shouldHideDirectEdge,
    sourceHandle,
    data: edgeInsertPath ? { insertPath: edgeInsertPath } : undefined,
  });
}

export const getTaskDescription = (
  taskName: string,
  tasks?: TaskDefinitions,
) => {
  return tasks?.[taskName]?.description ?? "No description provided.";
};

export const getTaskAction = (taskName: string, tasks?: TaskDefinitions) => {
  return tasks?.[taskName]?.action;
};

export const getGroupId = (id: string, groups?: THighlightGroups) => {
  const groupId = id.match(/^step-\d+-(conditional|loop|parallel)/)?.[0];

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
    id: `${EIndicatorType.WORKFLOW_START}-${id}`,
    type: ENodeType.INDICATOR,
    position: { x: 0, y: 0 },
    data: {
      ...ctx.config.nodes[ENodeType.INDICATOR][type],
      level,
      groupName,
      indicator: type,
    },
  } satisfies GraphNode<ENodeType.INDICATOR>;
};
// Ensure the workflow start indicator exists for the first workflow node.
const ensureWorkflowStartIndicator = (
  ctx: TraversalContext,
  targetNodeId: string,
  level: number,
  groupName?: string,
) => {
  if (!ctx.nodes.length) {
    const startIndicator = getIndicator(
      EIndicatorType.WORKFLOW_START,
      targetNodeId,
      ctx,
      level,
      groupName,
    );

    if (startIndicator) {
      ctx.nodes.push(startIndicator);
    }
  }
};
// Add the start indicator edge when the current step has no incoming edges.
const ensureWorkflowStartEdge = (
  ctx: TraversalContext,
  incoming: string[],
  targetNodeId: string,
  stepPath: FlowStepPath,
) => {
  if (!incoming.length) {
    const startIndicatorId = `${EIndicatorType.WORKFLOW_START}-${targetNodeId}`;

    addEdge(ctx, startIndicatorId, targetNodeId, undefined, undefined, stepPath);
  }
};
// Push a regular task node into the graph.
const addTaskNode = (
  ctx: TraversalContext,
  config: INodeConfig,
  { taskNodeId, taskName, stepId, level, groupName, stepPath }: TaskNodeArgs,
) => {
  ctx.nodes.push({
    ...getNodeDimensions(ENodeType.TASK, config),
    ...DEFAULT_NODE_PROPS,
    selectable: true,
    id: taskNodeId,
    type: ENodeType.TASK,
    position: { x: 0, y: 0 },
    data: {
      ...config.nodes[ENodeType.TASK](taskNodeId, taskName, ctx.tasks),
      stepId,
      level,
      groupName,
      stepPath,
    },
  });
};
// Push the base agent node and all of its related child nodes.
const addAgentGraph = (
  ctx: TraversalContext,
  config: INodeConfig,
  taskNodeArgs: TaskNodeArgs,
  tools: string[],
  model: string,
) => {
  const { taskNodeId, taskName, stepId, level, groupName, stepPath } =
    taskNodeArgs;
  const action = getTaskAction(taskName, ctx.tasks);

  ctx.nodes.push({
    ...getNodeDimensions(ENodeType.AGENT, config),
    ...DEFAULT_NODE_PROPS,
    selectable: true,
    id: taskNodeId,
    type: ENodeType.AGENT,
    position: { x: 0, y: 0 },
    data: {
      description: getTaskDescription(taskName, ctx.tasks),
      ...config.nodes[ENodeType.AGENT],
      stepId,
      action,
      level,
      groupName,
      stepPath,
      title: taskName,
      i18nTitle: undefined,
    },
  });

  if (model) {
    const modelNodeId = `model-${taskNodeId}`;

    ctx.nodes.push({
      ...getNodeDimensions(ENodeType.MODEL, config),
      ...DEFAULT_NODE_PROPS,
      id: modelNodeId,
      type: ENodeType.MODEL,
      position: { x: 0, y: 0 },
      data: {
        ...config.nodes[ENodeType.MODEL],
        title: model,
        i18nTitle: undefined,
        level,
      },
    });

    addEdge(ctx, taskNodeId, modelNodeId, ELinkType.AGENT_MODEL);
  }

  ctx.memoryDefinitions.forEach((memoryDefinition, index) => {
    const memoryProperties = memoryDefinition.schema?.properties;
    const memoryNodeId = `memory-${index}-${taskNodeId}`;

    ctx.nodes.push({
      ...getNodeDimensions(ENodeType.MEMORY, config),
      ...DEFAULT_NODE_PROPS,
      id: memoryNodeId,
      type: ENodeType.MEMORY,
      position: { x: 0, y: 0 },
      data: {
        ...config.nodes[ENodeType.MEMORY],
        title: memoryDefinition.name,
        i18nTitle: undefined,
        description: memoryProperties
          ? Object.keys(memoryProperties).join(", ")
          : "",
      },
    });

    addEdge(ctx, taskNodeId, memoryNodeId, ELinkType.AGENT_MEMORY);
  });

  tools.forEach((tool) => {
    const toolId = `tool-${tool}`;

    ctx.nodes.push({
      ...getNodeDimensions(ENodeType.TOOL, config),
      ...DEFAULT_NODE_PROPS,
      id: toolId,
      type: ENodeType.TOOL,
      position: { x: 0, y: 0 },
      data: {
        ...config.nodes[ENodeType.TOOL],
        title: tool,
        i18nTitle: undefined,
        level,
      },
    });

    addEdge(ctx, taskNodeId, toolId, ELinkType.AGENT_TOOL);
  });
};
// Push the operator node that will own nested steps.
const addOperatorNode = (
  ctx: TraversalContext,
  config: INodeConfig,
  {
    operatorNodeId,
    operatorType,
    stepId,
    level,
    groupName,
    stepPath,
    strategy,
  }: OperatorNodeArgs,
) => {
  ctx.nodes.push({
    ...getNodeDimensions(ENodeType.OPERATOR, config),
    ...DEFAULT_NODE_PROPS,
    selectable:
      operatorType === StepType.Conditional ||
      operatorType === StepType.Parallel ||
      operatorType === StepType.Loop,
    id: operatorNodeId,
    type: ENodeType.OPERATOR,
    position: { x: 0, y: 0 },
    data: {
      ...config.nodes[ENodeType.OPERATOR][operatorType],
      stepId,
      level,
      groupName,
      stepPath,
      strategy,
    },
  });
};
const addBranchPlaceholderNode = (
  ctx: TraversalContext,
  config: INodeConfig,
  operatorNodeId: string,
  branchIndex: number,
  level: number,
  insertPath: FlowStepPath,
  label?: string,
  incoming: string[] = [operatorNodeId],
) => {
  const placeholderNodeId = `${operatorNodeId}-branch-${branchIndex}-placeholder`;
  const groupName = getGroupId(placeholderNodeId, config.highlights);

  ctx.nodes.push({
    ...getNodeDimensions(ENodeType.BRANCH_PLACEHOLDER, config),
    ...DEFAULT_NODE_PROPS,
    id: placeholderNodeId,
    type: ENodeType.BRANCH_PLACEHOLDER,
    position: { x: 0, y: 0 },
    data: {
      ...config.nodes[ENodeType.BRANCH_PLACEHOLDER],
      level,
      groupName,
      insertPath,
      label,
    },
  });
  ctx.placeholderNodeIds.add(placeholderNodeId);
  connectIncomingEdges(ctx, uniqueIds(incoming), placeholderNodeId);

  return placeholderNodeId;
};
const CONDITIONAL_ELSE_LABEL = "else";
const getConditionalBranchLabel = (
  branch: CompiledConditionalStep["branches"][number],
) => {
  if (!branch.condition) {
    return CONDITIONAL_ELSE_LABEL;
  }

  if (branch.condition.kind === "expression") {
    return branch.condition.source;
  }

  if (typeof branch.condition.value === "string") {
    return branch.condition.value;
  }

  try {
    return JSON.stringify(branch.condition.value);
  } catch {
    return String(branch.condition.value);
  }
};
// Traverse parallel steps as separate branches from the operator node.
const walkParallelSteps = (
  step: CompiledParallelStep,
  operatorNodeId: string,
  level: number,
  ctx: TraversalContext,
  stepPath: FlowStepPath,
) => {
  if (!ctx.config) {
    return [operatorNodeId];
  }

  const parallelStepsPath: FlowStepPath = [...stepPath, "parallel", "steps"];
  const parallelSteps = Array.isArray(step.steps) ? step.steps : [];

  parallelSteps.forEach((branchStep, branchIndex) => {
    walkStep({
      step: branchStep,
      index: 0,
      pathIndex: branchIndex,
      level: level + 1,
      prefix: `${operatorNodeId}${branchIndex}`,
      incoming: [operatorNodeId],
      ctx,
      path: parallelStepsPath,
      disableEntryInsertPath: true,
    });
  });

  const insertPath: FlowStepPath = [...parallelStepsPath, parallelSteps.length];
  const placeholderNodeId = addBranchPlaceholderNode(
    ctx,
    ctx.config,
    operatorNodeId,
    parallelSteps.length,
    level + 1,
    insertPath,
  );

  return [placeholderNodeId];
};
// Traverse conditional branches with their own nested step lists.
const walkConditionalBranches = (
  step: CompiledConditionalStep,
  operatorNodeId: string,
  level: number,
  ctx: TraversalContext,
  stepPath: FlowStepPath,
) => {
  if (!ctx.config) {
    return [operatorNodeId];
  }

  const config = ctx.config;

  return step.branches.flatMap((branch, branchIndex) => {
    const branchLabel = getConditionalBranchLabel(branch);
    const branchSteps = Array.isArray(branch.steps) ? branch.steps : [];
    const conditionalStepsPath: FlowStepPath = [
      ...stepPath,
      "conditional",
      "when",
      branchIndex,
      "steps",
    ];
    const insertPath: FlowStepPath = [
      ...conditionalStepsPath,
      branchSteps.length,
    ];
    const branchExits =
      branchSteps.length > 0
        ? walkSteps({
            steps: branchSteps,
            level: level + 1,
            prefix: `${operatorNodeId}${branchIndex}`,
            incoming: [operatorNodeId],
            ctx,
            path: conditionalStepsPath,
            entryEdgeLabel: branchLabel,
          })
        : [operatorNodeId];
    const placeholderNodeId = addBranchPlaceholderNode(
      ctx,
      config,
      operatorNodeId,
      branchIndex,
      level + 1,
      insertPath,
      branchLabel,
      branchExits,
    );

    return [placeholderNodeId];
  });
};
// Traverse loop steps in sequence under the operator node.
const walkLoopSteps = (
  step: CompiledLoopStep,
  operatorNodeId: string,
  level: number,
  ctx: TraversalContext,
  stepPath: FlowStepPath,
) => {
  if (!ctx.config) {
    return [operatorNodeId];
  }

  const loopSteps = Array.isArray(step.steps) ? step.steps : [];
  const loopStepsPath: FlowStepPath = [...stepPath, "loop", "steps"];
  const insertPath: FlowStepPath = [...loopStepsPath, loopSteps.length];
  const loopExits =
    loopSteps.length > 0
      ? walkSteps({
          steps: loopSteps,
          level: level + 1,
          prefix: operatorNodeId,
          incoming: [operatorNodeId],
          ctx,
          path: loopStepsPath,
        })
      : [operatorNodeId];
  const placeholderNodeId = addBranchPlaceholderNode(
    ctx,
    ctx.config,
    operatorNodeId,
    0,
    level + 1,
    insertPath,
    undefined,
    loopExits,
  );

  return [placeholderNodeId];
};

type WalkStepArgs = Omit<WalkArgs, "steps"> & {
  step: CompiledStep;
  index: number;
  pathIndex?: number;
  disableEntryInsertPath?: boolean;
};

const walkStep = ({
  step,
  index,
  level,
  prefix,
  incoming,
  ctx,
  path,
  pathIndex,
  entryEdgeLabel,
  disableEntryInsertPath,
}: WalkStepArgs): string[] => {
  if (!ctx.config) {
    return incoming;
  }

  const config = ctx.config;
  const idBase = `${prefix}-${index}`;
  const stepPath = buildStepPath(path, index, pathIndex);
  const stepId = step.id;

  if (step.type === StepType.Task) {
    const taskName = step.taskName;
    const taskNodeId = `${idBase}-${taskName}`;
    const groupName = getGroupId(taskNodeId, config.highlights);

    ctx.nodePaths.set(taskNodeId, stepPath);

    ensureWorkflowStartIndicator(ctx, taskNodeId, level, groupName);
    ensureWorkflowStartEdge(ctx, incoming, taskNodeId, stepPath);

    const { tools, model } = getTaskMeta(taskName, ctx.tasks);

    if (tools.length) {
      addAgentGraph(
        ctx,
        config,
        {
          taskNodeId,
          taskName,
          stepId,
          level,
          groupName,
          stepPath,
        },
        tools,
        model,
      );
    } else {
      addTaskNode(ctx, config, {
        taskNodeId,
        taskName,
        stepId,
        level,
        groupName,
        stepPath,
      });
    }

    connectIncomingEdges(
      ctx,
      incoming,
      taskNodeId,
      disableEntryInsertPath ? undefined : stepPath,
      entryEdgeLabel,
    );

    return [taskNodeId];
  }

  const operatorType = step.type;
  const operatorNodeId = `${idBase}-${operatorType}`;
  const groupName = getGroupId(operatorNodeId, config.highlights);

  ctx.nodePaths.set(operatorNodeId, stepPath);
  ensureWorkflowStartIndicator(ctx, operatorNodeId, level, groupName);
  ensureWorkflowStartEdge(ctx, incoming, operatorNodeId, stepPath);

  addOperatorNode(ctx, config, {
    operatorNodeId,
    operatorType,
    stepId,
    level,
    groupName,
    stepPath,
    strategy: step.type === StepType.Parallel ? step.strategy : undefined,
  });

  connectIncomingEdges(
    ctx,
    incoming,
    operatorNodeId,
    disableEntryInsertPath ? undefined : stepPath,
    entryEdgeLabel,
  );

  if (step.type === StepType.Parallel) {
    const exits = walkParallelSteps(step, operatorNodeId, level, ctx, stepPath);

    return uniqueIds(exits.length ? exits : [operatorNodeId]);
  }

  if (step.type === StepType.Conditional) {
    const exits = walkConditionalBranches(
      step,
      operatorNodeId,
      level,
      ctx,
      stepPath,
    );

    return uniqueIds(exits.length ? exits : [operatorNodeId]);
  }

  const exits = walkLoopSteps(step, operatorNodeId, level, ctx, stepPath);

  return uniqueIds(exits.length ? exits : [operatorNodeId]);
};

export function walkSteps({
  steps,
  level,
  prefix,
  incoming,
  ctx,
  path,
  entryEdgeLabel,
}: WalkArgs): string[] {
  if (!Array.isArray(steps) || steps.length === 0) {
    return uniqueIds(incoming);
  }

  let currentSources = uniqueIds(incoming);

  steps.forEach((step, index) => {
    currentSources = walkStep({
      step,
      index,
      level,
      prefix,
      incoming: currentSources,
      ctx,
      path,
      entryEdgeLabel: index === 0 ? entryEdgeLabel : undefined,
    });
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
