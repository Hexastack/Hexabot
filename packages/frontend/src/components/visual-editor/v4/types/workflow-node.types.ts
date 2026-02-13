/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  CompiledStep,
  StepType,
  TaskDefinitions,
} from "@hexabot-ai/agentic";
import type { Edge, Node, NodeProps } from "@xyflow/react";
import type {
  EdgeMarkerType,
  NodeConnection,
  ResizeControlDirection,
} from "@xyflow/system";
import type {
  CSSProperties,
  FC,
  JSXElementConstructor,
  ReactNode,
} from "react";

import type { TTranslationKeys } from "@/i18n/i18n.types";
import type { IAction } from "@/types/action.types";
import { IMemoryDefinition } from "@/types/memory-definition.types";

import { EdgeWithButton } from "../components/edges/EdgeWithButton";
import { Agent } from "../components/workflow-nodes/Agent";
import { Memory } from "../components/workflow-nodes/Agent/Memory";
import { Model } from "../components/workflow-nodes/Agent/Model";
import { Tool } from "../components/workflow-nodes/Agent/Tool";
import { BranchPlaceholder } from "../components/workflow-nodes/BranchPlaceholder";
import { Group } from "../components/workflow-nodes/Group";
import { Indicator } from "../components/workflow-nodes/Indicator";
import { Operator } from "../components/workflow-nodes/Operator";
import { Task } from "../components/workflow-nodes/Task";
import type { FlowStepPath } from "../types/workflow-path.types";

import { NodeExecutionState } from "./workflow.types";

export type WorkflowIcon = JSXElementConstructor<any>;
type NodeDataTitle =
  | { title: string; i18nTitle?: undefined }
  | { i18nTitle: TTranslationKeys; title?: undefined };

export type WorkflowNodeTheme = {
  Icon?: WorkflowIcon;
  color?: CSSProperties["color"];
  bgColor?: CSSProperties["color"];
  iconColor?: CSSProperties["color"];
  borderColor?: CSSProperties["color"];
};

export type CommonNodeDadaTypes = NodeDataTitle & {
  stepId?: string;
  description?: string;
  groupName?: string;
  stepPath?: FlowStepPath;
  theme: WorkflowNodeTheme;
  level?: number;
  executionState?: NodeExecutionState;
};

type CommonNodeData<T extends ENodeType> = CommonNodeDadaTypes & {
  ports: Port<T>[];
};

// model types
export type ModelData = CommonNodeData<ENodeType.MODEL>;

// Tool types
export type ToolData = CommonNodeData<ENodeType.TOOL>;

// Agent types
export type AgentData = CommonNodeData<ENodeType.AGENT> & {
  tools: string[];
  model: string;
  memory: string;
  action?: string;
};

// Task types
export type TaskData = CommonNodeData<ENodeType.TASK> & {
  actionName?: string;
};

// Indicator types
export type IndicatorData = CommonNodeData<ENodeType.INDICATOR> & {
  indicator?: EIndicatorType;
};

export type BranchPlaceholderData = CommonNodeData<ENodeType.BRANCH_PLACEHOLDER> & {
  insertPath?: FlowStepPath;
  label?: string;
};

export enum EIndicatorType {
  WORKFLOW_START = "workflowStart",
  WORKFLOW_END = "workflowEnd",
}

export type EOperatorType = Extract<
  StepType,
  StepType.Conditional | StepType.Loop | StepType.Parallel
>;

export type OperatorData = CommonNodeData<ENodeType.OPERATOR> & {
  operatorType?: EOperatorType;
  strategy?: "wait_all" | "wait_any";
};

// Group types
export type GroupData = {
  ports: Port<ENodeType.GROUP>[];
  theme: {
    bgColor: string;
  };
  groupName?: never;
};

// Memory types
export type MemoryData = CommonNodeData<ENodeType.MEMORY> & {};

// Link/Edge types
export type EdgeLink = Edge & { id: string; source: string; target: string };

export enum EHandleType {
  TARGET = "target",
  SOURCE = "source",
}

export enum ELinkType {
  MODEL_IN = "modelIn",
  TOOL_IN = "toolIn",
  AGENT_IN = "agentIn",
  AGENT_OUT = "agentOut",
  AGENT_MEMORY = "agentMemory",
  AGENT_MODEL = "agentModel",
  AGENT_TOOL = "agentTool",
  TASK_IN = "taskIn",
  TASK_OUT = "taskOut",
  TASK_TOOL = "taskTool",
  INDICATOR_IN = "indicatorIn",
  INDICATOR_OUT = "indicatorOut",
  OPERATOR_IN = "operatorIn",
  OPERATOR_OUT = "operatorOut",
  GROUP_IN = "groupIn",
  GROUP_OUT = "groupOut",
  MEMORY_IN = "memoryIn",
  BRANCH_PLACEHOLDER_IN = "branchPlaceholderIn",
  BRANCH_PLACEHOLDER_OUT = "branchPlaceholderOut",
}

export type Port<P extends string> = Extract<ELinkType, `${P}${string}`>;

// Workflow global types
export type THighlightGroups = {
  [K in EOperatorType]?: { padding?: number; color?: string };
};

export type TNodeDimensions = {
  [K in ENodeType]?: { width: number; height: number };
};

export type TEdgeStyles = {
  [K in EEdgeType]?: { style?: CSSProperties; markerEnd?: EdgeMarkerType };
};

export interface INodeConfig {
  highlights?: THighlightGroups;
  direction?: ResizeControlDirection;
  dimensions?: TNodeDimensions;
  edges?: TEdgeStyles;
  nodes: {
    [K in ENodeType]: K extends ENodeType.OPERATOR
      ? { [O in EOperatorType]: OperatorData }
      : K extends ENodeType.INDICATOR
        ? { [I in EIndicatorType]: IndicatorData }
        : K extends ENodeType.TASK
          ? (
              stepId: string,
              taskName: string,
              tasks?: TaskDefinitions,
            ) => TaskData
          : NodeDataTypes[K];
  };
}

export interface IBuildNodesAndEdgesProps {
  config: INodeConfig;
  flow?: CompiledStep[];
  tasks?: TaskDefinitions;
  memoryDefinitions: IMemoryDefinition[];
}

export type NodeDataTypes = {
  [ENodeType.MODEL]: ModelData;
  [ENodeType.TOOL]: ToolData;
  [ENodeType.AGENT]: AgentData;
  [ENodeType.INDICATOR]: IndicatorData;
  [ENodeType.OPERATOR]: OperatorData;
  [ENodeType.TASK]: TaskData;
  [ENodeType.GROUP]: GroupData;
  [ENodeType.MEMORY]: MemoryData;
  [ENodeType.BRANCH_PLACEHOLDER]: BranchPlaceholderData;
};

export type NodeType<V, T = NodeDataTypes> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

export type GraphNode<T extends keyof NodeDataTypes | null = null> =
  T extends keyof NodeDataTypes
    ? Node<NodeDataTypes[T], T>
    :
        | Node<ModelData, ENodeType.MODEL>
        | Node<ToolData, ENodeType.TOOL>
        | Node<AgentData, ENodeType.AGENT>
        | Node<IndicatorData, ENodeType.INDICATOR>
        | Node<OperatorData, ENodeType.OPERATOR>
        | Node<TaskData, ENodeType.TASK>
        | Node<GroupData, ENodeType.GROUP>
        | Node<MemoryData, ENodeType.MEMORY>
        | Node<BranchPlaceholderData, ENodeType.BRANCH_PLACEHOLDER>;

export enum ENodeType {
  MODEL = "model",
  TOOL = "tool",
  AGENT = "agent",
  INDICATOR = "indicator",
  OPERATOR = "operator",
  TASK = "task",
  GROUP = "group",
  MEMORY = "memory",
  BRANCH_PLACEHOLDER = "branchPlaceholder",
}

export enum EEdgeType {
  EDGE_WITH_BUTTON = "edgeWithButton",
}

export const NODE_TYPES = {
  [ENodeType.MODEL]: Model,
  [ENodeType.TOOL]: Tool,
  [ENodeType.AGENT]: Agent,
  [ENodeType.INDICATOR]: Indicator,
  [ENodeType.OPERATOR]: Operator,
  [ENodeType.TASK]: Task,
  [ENodeType.GROUP]: Group,
  [ENodeType.MEMORY]: Memory,
  [ENodeType.BRANCH_PLACEHOLDER]: BranchPlaceholder,
} satisfies {
  [NT in ENodeType]: FC<NodeProps<GraphNode<NT>>>;
};

export const EDGE_TYPES = {
  [EEdgeType.EDGE_WITH_BUTTON]: EdgeWithButton,
} satisfies {
  [K in EEdgeType]: typeof EdgeWithButton;
};

type FlattenedNodeData<T extends ENodeType = ENodeType> = Omit<
  GraphNode<T>,
  "data"
> &
  GraphNode<T>["data"];

// Context types
export type IWorkflowNodeContext<T extends ENodeType = ENodeType> = Omit<
  FlattenedNodeData<T>,
  "action"
> &
  Partial<CommonNodeDadaTypes> & {
    action?: IAction | undefined;
    connections: NodeConnection[];
  };

export interface IWorkflowNodeProps {
  id: string;
  children: ReactNode;
}

export type WorkflowGraph = { nodes: GraphNode[]; edges: Edge[] };
