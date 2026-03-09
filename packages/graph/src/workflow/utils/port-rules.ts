/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Position } from "@xyflow/react";
import type { ResizeControlDirection } from "@xyflow/system";
import type { CSSProperties } from "react";

import type { WorkflowPort } from "../types/workflow-node.types";

const LINK = {
  SINGLE_BINDING_IN: 'singleBindingIn',
  TOOL_IN: 'toolIn',
  BINDING_PLACEHOLDER_IN: 'bindingPlaceholderIn',
  AGENT_IN: 'agentIn',
  AGENT_OUT: 'agentOut',
  AGENT_MEMORY: 'agentMemory',
  AGENT_SINGLE_BINDING: 'agentModel',
  AGENT_TOOL: 'agentTool',
  AGENT_BINDING_OUT: 'agentBindingOut',
  TASK_IN: 'taskIn',
  TASK_OUT: 'taskOut',
  TASK_TOOL: 'taskTool',
  TASK_BINDING_OUT: 'taskBindingOut',
  INDICATOR_IN: 'indicatorIn',
  INDICATOR_OUT: 'indicatorOut',
  OPERATOR_IN: 'operatorIn',
  OPERATOR_OUT: 'operatorOut',
  GROUP_IN: 'groupIn',
  GROUP_OUT: 'groupOut',
  MEMORY_IN: 'memoryIn',
  BRANCH_PLACEHOLDER_IN: 'branchPlaceholderIn',
  BRANCH_PLACEHOLDER_OUT: 'branchPlaceholderOut',
} as const;

type LinkType = (typeof LINK)[keyof typeof LINK];
type HandleType = "target" | "source";

const CONDITIONAL_OPERATOR_OUT_PATTERN = /^operatorOut-(\d+)-(\d+)$/;
const BINDING_OUT_PATTERN = /^(agentBindingOut|taskBindingOut)-(\d+)-(\d+)-(.+)$/;

type AgentOutHandle =
  | typeof LINK.AGENT_SINGLE_BINDING
  | typeof LINK.AGENT_MEMORY
  | typeof LINK.AGENT_TOOL;

type BindingOutHandle =
  | typeof LINK.AGENT_BINDING_OUT
  | typeof LINK.TASK_BINDING_OUT;

const AGENT_OUT_HANDLE_PROGRESS: Record<
  AgentOutHandle,
  { horizontal: number; vertical: number }
> = {
  agentModel: { horizontal: 10, vertical: 30 },
  agentMemory: { horizontal: 50, vertical: 50 },
  agentTool: { horizontal: 90, vertical: 70 },
};

export const AGENT_ATTACHMENT_SOURCE_HANDLES = new Set<string>([
  LINK.AGENT_TOOL,
  LINK.AGENT_SINGLE_BINDING,
  LINK.AGENT_MEMORY,
]);

export const getConditionalOperatorOutHandleMeta = (
  id: WorkflowPort | string,
) => {
  const match = String(id).match(CONDITIONAL_OPERATOR_OUT_PATTERN);

  if (!match) {
    return;
  }

  const index = Number(match[1]);
  const total = Number(match[2]);

  if (
    !Number.isInteger(index) ||
    !Number.isInteger(total) ||
    index < 0 ||
    total < 1 ||
    index >= total
  ) {
    return;
  }

  return { index, total } as const;
};

export const getBindingOutHandleMeta = (id: WorkflowPort | string) => {
  const match = String(id).match(BINDING_OUT_PATTERN);

  if (!match) {
    return;
  }

  const baseId = match[1] as BindingOutHandle;
  const index = Number(match[2]);
  const total = Number(match[3]);
  let bindingKind = match[4];

  try {
    bindingKind = decodeURIComponent(match[4]);
  } catch {
    return;
  }

  if (
    !Number.isInteger(index) ||
    !Number.isInteger(total) ||
    index < 0 ||
    total < 1 ||
    index >= total ||
    !bindingKind
  ) {
    return;
  }

  return {
    baseId,
    index,
    total,
    bindingKind,
  } as const;
};

export const getAgentOutHandleMeta = (id: WorkflowPort | string) => {
  const handleId = String(id) as AgentOutHandle;
  const progress = AGENT_OUT_HANDLE_PROGRESS[handleId];

  if (!progress) {
    return;
  }

  return {
    handleId,
    horizontal: progress.horizontal,
    vertical: progress.vertical,
  } as const;
};

export const isAttachmentSourceHandle = (
  id: WorkflowPort | string | null | undefined,
): boolean => {
  if (!id) {
    return false;
  }

  const handleId = String(id);

  return (
    AGENT_ATTACHMENT_SOURCE_HANDLES.has(handleId) ||
    Boolean(getBindingOutHandleMeta(handleId))
  );
};

const getPortBaseId = (id: WorkflowPort): LinkType => {
  const conditionalMeta = getConditionalOperatorOutHandleMeta(id);

  if (conditionalMeta) {
    return LINK.OPERATOR_OUT;
  }

  const bindingMeta = getBindingOutHandleMeta(id);

  if (bindingMeta) {
    return bindingMeta.baseId;
  }

  return id as LinkType;
};
const getConditionalOperatorOutStyle = (
  id: WorkflowPort,
  direction: ResizeControlDirection,
): CSSProperties | undefined => {
  const meta = getConditionalOperatorOutHandleMeta(id);

  if (!meta) {
    return;
  }

  const progress = ((meta.index + 1) / (meta.total + 1)) * 100;

  return direction === "horizontal"
    ? { top: `${progress}%` }
    : { left: `${progress}%` };
};
const getAgentOutStyle = (
  id: WorkflowPort,
  direction: ResizeControlDirection,
): CSSProperties | undefined => {
  const meta = getAgentOutHandleMeta(id);

  if (!meta) {
    return;
  }

  return direction === "horizontal"
    ? { left: `${meta.horizontal}%` }
    : { top: `${meta.vertical}%` };
};
const getBindingOutStyle = (
  id: WorkflowPort,
  direction: ResizeControlDirection,
): CSSProperties | undefined => {
  const meta = getBindingOutHandleMeta(id);

  if (!meta) {
    return;
  }

  const progress = ((meta.index + 1) / (meta.total + 1)) * 100;

  return direction === "horizontal"
    ? { left: `${progress}%` }
    : { top: `${progress}%` };
};

type PortRule = {
  type: HandleType;
  position: {
    horizontal: Position;
    vertical: Position;
  };
  style?: (id: WorkflowPort, direction: ResizeControlDirection) => CSSProperties | undefined;
};

const PORT_RULES: Partial<Record<LinkType, PortRule>> = {
  [LINK.GROUP_IN]: {
    type: 'target',
    position: { horizontal: Position.Left, vertical: Position.Top },
  },
  [LINK.GROUP_OUT]: {
    type: 'source',
    position: { horizontal: Position.Right, vertical: Position.Bottom },
  },
  [LINK.INDICATOR_IN]: {
    type: 'target',
    position: { horizontal: Position.Left, vertical: Position.Top },
  },
  [LINK.INDICATOR_OUT]: {
    type: 'source',
    position: { horizontal: Position.Right, vertical: Position.Bottom },
  },
  [LINK.OPERATOR_IN]: {
    type: 'target',
    position: { horizontal: Position.Left, vertical: Position.Top },
  },
  [LINK.OPERATOR_OUT]: {
    type: 'source',
    position: { horizontal: Position.Right, vertical: Position.Bottom },
    style: getConditionalOperatorOutStyle,
  },
  [LINK.TASK_IN]: {
    type: 'target',
    position: { horizontal: Position.Left, vertical: Position.Top },
  },
  [LINK.TASK_OUT]: {
    type: 'source',
    position: { horizontal: Position.Right, vertical: Position.Bottom },
  },
  [LINK.TASK_TOOL]: {
    type: 'source',
    position: { horizontal: Position.Bottom, vertical: Position.Left },
  },
  [LINK.TASK_BINDING_OUT]: {
    type: 'source',
    position: { horizontal: Position.Bottom, vertical: Position.Left },
    style: getBindingOutStyle,
  },
  [LINK.AGENT_IN]: {
    type: 'target',
    position: { horizontal: Position.Left, vertical: Position.Top },
    style: (_, direction) =>
      direction === 'horizontal' ? { top: '50%' } : undefined,
  },
  [LINK.AGENT_OUT]: {
    type: 'source',
    position: { horizontal: Position.Right, vertical: Position.Bottom },
    style: (_, direction) =>
      direction === 'horizontal' ? { top: '50%' } : undefined,
  },
  [LINK.AGENT_SINGLE_BINDING]: {
    type: 'source',
    position: { horizontal: Position.Bottom, vertical: Position.Left },
    style: getAgentOutStyle,
  },
  [LINK.AGENT_MEMORY]: {
    type: 'source',
    position: { horizontal: Position.Bottom, vertical: Position.Left },
    style: getAgentOutStyle,
  },
  [LINK.AGENT_TOOL]: {
    type: 'source',
    position: { horizontal: Position.Bottom, vertical: Position.Left },
    style: getAgentOutStyle,
  },
  [LINK.AGENT_BINDING_OUT]: {
    type: 'source',
    position: { horizontal: Position.Bottom, vertical: Position.Left },
    style: getBindingOutStyle,
  },
  [LINK.TOOL_IN]: {
    type: 'target',
    position: { horizontal: Position.Top, vertical: Position.Right },
    style: (_, direction) =>
      direction === 'horizontal' ? { left: '50%' } : undefined,
  },
  [LINK.BINDING_PLACEHOLDER_IN]: {
    type: 'target',
    position: { horizontal: Position.Top, vertical: Position.Right },
    style: (_, direction) =>
      direction === 'horizontal' ? { left: '50%' } : undefined,
  },
  [LINK.SINGLE_BINDING_IN]: {
    type: 'target',
    position: { horizontal: Position.Top, vertical: Position.Right },
    style: (_, direction) =>
      direction === 'horizontal' ? { left: '50%' } : undefined,
  },
  [LINK.MEMORY_IN]: {
    type: 'target',
    position: { horizontal: Position.Top, vertical: Position.Right },
    style: (_, direction) =>
      direction === 'horizontal' ? { left: '50%' } : undefined,
  },
  [LINK.BRANCH_PLACEHOLDER_IN]: {
    type: 'target',
    position: { horizontal: Position.Left, vertical: Position.Top },
  },
  [LINK.BRANCH_PLACEHOLDER_OUT]: {
    type: 'source',
    position: { horizontal: Position.Right, vertical: Position.Bottom },
  },
};
const DEFAULT_PORT_RULE: PortRule = {
  type: "target",
  position: { horizontal: Position.Left, vertical: Position.Top },
};
const SPECIAL_DIMENSION_HANDLES = new Set<LinkType>([
  LINK.TOOL_IN,
  LINK.BINDING_PLACEHOLDER_IN,
  LINK.SINGLE_BINDING_IN,
  LINK.MEMORY_IN,
  LINK.AGENT_TOOL,
  LINK.AGENT_SINGLE_BINDING,
  LINK.AGENT_MEMORY,
  LINK.AGENT_BINDING_OUT,
  LINK.TASK_BINDING_OUT,
]);

export const resolveWorkflowPortRule = (
  id: WorkflowPort,
  direction: ResizeControlDirection,
): {
  baseId: LinkType;
  type: HandleType;
  position: Position;
  style?: CSSProperties;
} => {
  const baseId = getPortBaseId(id);
  const rule = PORT_RULES[baseId] || DEFAULT_PORT_RULE;

  return {
    baseId,
    type: rule.type,
    position: rule.position[direction],
    style: rule.style?.(id, direction),
  };
};

export const getWorkflowPortDimensions = (
  id: WorkflowPort,
  position: Position,
  direction: ResizeControlDirection,
): CSSProperties | undefined => {
  const baseId = getPortBaseId(id);
  const isHorizontalLeftRight =
    direction === "horizontal" &&
    [Position.Left, Position.Right].includes(position);
  const isVerticalTopBottom =
    direction === "vertical" &&
    [Position.Top, Position.Bottom].includes(position);

  if (isHorizontalLeftRight) {
    return {
      width: "6px",
      height: "14px",
    };
  }

  if (isVerticalTopBottom) {
    return {
      width: "14px",
      height: "6px",
    };
  }

  if (SPECIAL_DIMENSION_HANDLES.has(baseId)) {
    return direction === "horizontal"
      ? { width: "14px", height: "6px" }
      : { width: "6px", height: "14px" };
  }
};

export const getWorkflowPortBorderRadius = (
  position: Position,
  direction: ResizeControlDirection,
): CSSProperties => {
  const radiusMap = {
    [Position.Left]: {
      horizontal: { borderTopRightRadius: "0", borderBottomRightRadius: "0" },
      vertical: { borderBottomLeftRadius: "0", borderBottomRightRadius: "0" },
    },
    [Position.Right]: {
      horizontal: { borderTopLeftRadius: "0", borderBottomLeftRadius: "0" },
      vertical: { borderTopLeftRadius: "0", borderTopRightRadius: "0" },
    },
    [Position.Bottom]: {
      horizontal: { borderTopLeftRadius: "0", borderTopRightRadius: "0" },
      vertical: { borderBottomRightRadius: "0", borderTopRightRadius: "0" },
    },
    [Position.Top]: {
      horizontal: { borderBottomLeftRadius: "0", borderBottomRightRadius: "0" },
      vertical: { borderTopLeftRadius: "0", borderBottomLeftRadius: "0" },
    },
  } as const;

  return radiusMap[position][direction];
};
