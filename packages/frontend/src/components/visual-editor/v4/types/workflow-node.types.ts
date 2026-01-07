/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { FlowStep, WorkflowDefinition } from "@hexabot-ai/agentic";
import type { SvgIconTypeMap } from "@mui/material";
import type { OverridableComponent } from "@mui/material/OverridableComponent";
import type { Edge, Node, NodeProps } from "@xyflow/react";
import type {
  EdgeMarkerType,
  NodeConnection,
  ResizeControlDirection,
} from "@xyflow/system";
import type { CSSProperties, FC, ReactNode, SVGProps } from "react";

import type { TTranslationKeys } from "@/i18n/i18n.types";

import { EdgeWithButton } from "../components/edges/EdgeWithButton";
import { Group } from "../components/workflow-nodes/Group";
import { Indicator } from "../components/workflow-nodes/Indicator";
import { Operator } from "../components/workflow-nodes/Operator";
import { Task } from "../components/workflow-nodes/Task";

type CommonNodeData<T extends ENodeType> = {
  ports: Port<T>[];
  level?: number;
  groupName?: string;
};

// Task types
export type TaskData = CommonNodeData<ENodeType.TASK> & {
  theme: {
    Icon: FC<SVGProps<SVGSVGElement>>;
    color: CSSProperties["color"];
    bgColor: CSSProperties["color"];
  };
  description?: string;
  action?: string;
  name?: string;
};

// Indicator types
export type IndicatorData = CommonNodeData<ENodeType.INDICATOR> & {
  title: { i18n: TTranslationKeys; color: string };
  theme: {
    Icon: OverridableComponent<SvgIconTypeMap<{}, "svg">> & {
      muiName: string;
    };
    color: string;
    backgroundColor: string;
  };
  taskName?: string;
};

export enum EIndicatorType {
  START = "start",
  END = "end",
}

// Operator types
export enum EOperatorType {
  LOOP = "loop",
  PARALLEL = "parallel",
  CONDITIONAL = "conditional",
}

export type OperatorData = CommonNodeData<ENodeType.OPERATOR> & {
  operatorType?: EOperatorType;
  title: { i18n: TTranslationKeys; color: string };
  theme: {
    Icon: OverridableComponent<SvgIconTypeMap<{}, "svg">> & {
      muiName: string;
    };
    color: string;
    backgroundColor: string;
  };
  taskName?: string;
};

// Group types
export type GroupData = {
  ports: Port<ENodeType.GROUP>[];
  theme: {
    backgroundColor: string;
  };
  groupName?: never;
};

// Link/Edge types
export type EdgeLink = Edge & { id: string; source: string; target: string };

export enum EHandleType {
  TARGET = "target",
  SOURCE = "source",
}

export enum ELinkType {
  TASK_IN = "taskIn",
  TASK_OUT = "taskOut",
  INDICATOR_IN = "indicatorIn",
  INDICATOR_OUT = "indicatorOut",
  OPERATOR_IN = "operatorIn",
  OPERATOR_OUT = "operatorOut",
  GROUP_IN = "groupIn",
  GROUP_OUT = "groupOut",
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
              step: FlowStep,
              tasks: WorkflowDefinition["tasks"],
            ) => TaskData
          : NodeDataTypes[K];
  };
}

export interface IBuildNodesAndEdgesProps {
  config: INodeConfig;
  definition?: WorkflowDefinition;
}

export type NodeDataTypes = {
  [ENodeType.INDICATOR]: IndicatorData;
  [ENodeType.OPERATOR]: OperatorData;
  [ENodeType.TASK]: TaskData;
  [ENodeType.GROUP]: GroupData;
};

export type NodeType<V, T = NodeDataTypes> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

export type NodeData<T extends keyof NodeDataTypes | null = null> =
  T extends keyof NodeDataTypes
    ? Node<NodeDataTypes[T], T>
    :
        | Node<IndicatorData, ENodeType.INDICATOR>
        | Node<OperatorData, ENodeType.OPERATOR>
        | Node<TaskData, ENodeType.TASK>
        | Node<GroupData, ENodeType.GROUP>;

export enum ENodeType {
  INDICATOR = "indicator",
  OPERATOR = "operator",
  TASK = "task",
  GROUP = "group",
}

export enum EEdgeType {
  EDGE_WITH_BUTTON = "edgeWithButton",
}

export const NODE_TYPES = {
  [ENodeType.INDICATOR]: Indicator,
  [ENodeType.OPERATOR]: Operator,
  [ENodeType.TASK]: Task,
  [ENodeType.GROUP]: Group,
} satisfies {
  [NT in ENodeType]: FC<NodeProps<NodeData<NT>>>;
};

export const EDGE_TYPES = {
  [EEdgeType.EDGE_WITH_BUTTON]: EdgeWithButton,
} satisfies {
  [K in EEdgeType]: typeof EdgeWithButton;
};

type FlattenedNodeData<T extends ENodeType = ENodeType> = Omit<
  NodeData<T>,
  "data"
> &
  NodeData<T>["data"];

// Context types
export type IWorkflowNodeContext<T extends ENodeType = ENodeType> =
  FlattenedNodeData<T> & {
    connections: NodeConnection[];
  };

export interface IWorkflowNodeProps {
  id: string;
  children: ReactNode;
}
