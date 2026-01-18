/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Cancelable } from "@mui/utils/debounce";
import { UseMutateFunction } from "@tanstack/react-query";
import type { XYPosition } from "@xyflow/react";
import type { ResizeControlDirection } from "@xyflow/system";
import type { Dispatch, ReactNode, SetStateAction } from "react";

import type { IWorkflow, IWorkflowAttributes } from "@/types/workfow.types";

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
  executionStates: Record<string, { state: "start" | "success" }>;
  setExecutionStates: Dispatch<
    SetStateAction<Record<string, { state: "start" | "success" }>>
  >;
}

export interface WorkflowContextProps {
  children: ReactNode;
}

export type TCb<T> = ((props: T) => void | undefined) & Cancelable;
