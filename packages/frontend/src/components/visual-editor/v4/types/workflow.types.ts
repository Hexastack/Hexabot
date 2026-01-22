/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { WorkflowDefinition, WorkflowEventMap } from "@hexabot-ai/agentic";
import type { Cancelable } from "@mui/utils/debounce";
import type { UseMutateFunction } from "@tanstack/react-query";
import type { XYPosition } from "@xyflow/react";
import type { ResizeControlDirection } from "@xyflow/system";
import type { Dispatch, ReactNode, SetStateAction } from "react";

import type { IAction } from "@/types/action.types";
import type { IWorkflow, IWorkflowAttributes } from "@/types/workfow.types";

import type { FlowStepPath } from "./workflow-path.types";

export interface IWorkflowContext {
  getCentroid: () => XYPosition;
  selectNodes: (nodeIds: string[]) => void;
  getWorkflowFromCache: (id: string) => IWorkflow | undefined;
  selectedNodeIds: string[];
  setSelectedNodeIds: Dispatch<SetStateAction<string[]>>;
  selectedFlowId?: string;
  toFocusIds: string[];
  setToFocusIds: Dispatch<SetStateAction<string[]>>;
  openSearchPanel: boolean;
  setOpenSearchPanel: Dispatch<SetStateAction<boolean>>;
  getQuery: (key: string) => string;
  direction?: ResizeControlDirection;
  setDirection?: Dispatch<SetStateAction<ResizeControlDirection>>;
  removeWorkflowParams: () => Promise<void>;
  updateWorkflowURL: (workflowIid: string, nodeIds?: string[]) => Promise<void>;
  yaml: string;
  setYaml: Dispatch<SetStateAction<string>>;
  workflow?: IWorkflow;
  workflows?: IWorkflow[];
  debouncedWorkflowUpdate: ((params: Partial<IWorkflowAttributes>) => void) &
    Cancelable;
  updateWorkflow: UseMutateFunction<
    IWorkflow,
    Error,
    {
      id: string;
      params: Partial<IWorkflowAttributes>;
    },
    IWorkflow
  >;
  updateDefinition: (definition: WorkflowDefinition) => void;
  saveDefinition: () => void;
  isDefinitionDirty: boolean;
  isDefinitionSaving: boolean;
  addActionStep: (action: IAction, insertPath?: FlowStepPath | null) => void;
  removeStepAtPath: (stepPath: FlowStepPath, nodeId?: string) => void;
  executionStates: Record<string, { state: NodeExecutionState; t: number }[]>;
  setExecutionStates: Dispatch<
    Record<string, { state: NodeExecutionState; t: number }[]>
  >;
  actions: IAction[];
  definition?: WorkflowDefinition;
}

export interface WorkflowContextProps {
  children: ReactNode;
}

export type TCb<T> = ((props: T) => void | undefined) & Cancelable;

export type WorkflowEvent<
  T extends keyof WorkflowEventMap = keyof WorkflowEventMap,
> = T extends `${string}:${infer Rest}` ? Rest : T;

export type NodeExecutionState = "start" | "finish" | "suspended" | "error";

export type SubscribeWorkflowProps =
  WorkflowEventMap[keyof WorkflowEventMap] & {
    workflowEvent: WorkflowEvent;
    t: number;
  };
