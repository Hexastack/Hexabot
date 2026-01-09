/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  WorkflowCompileOptions,
  WorkflowDefinition,
} from "@hexabot-ai/agentic";
import { Cancelable } from "@mui/utils/debounce";
import type { XYPosition } from "@xyflow/react";
import type { ResizeControlDirection } from "@xyflow/system";
import type { Dispatch, ReactNode, SetStateAction } from "react";

import type { IWorkflow } from "@/types/workfow.types";

export interface IWorkflowContext {
  getCentroid: () => XYPosition;
  selectNodes: (nodeIds: string[]) => void;
  getWorkflowFromCache: (id: string) => IWorkflow | undefined;
  selectedNodeIds: string[];
  setSelectedNodeIds: Dispatch<SetStateAction<string[]>>;
  selectedFlowId: string;
  setSelectedFlowId: (id: string) => void;
  toFocusIds: string[];
  setToFocusIds: Dispatch<SetStateAction<string[]>>;
  openSearchPanel: boolean;
  setOpenSearchPanel: Dispatch<SetStateAction<boolean>>;
  getQuery: (key: string) => string;
  direction: ResizeControlDirection;
  setDirection: Dispatch<SetStateAction<ResizeControlDirection>>;
  removeWorkflowParams: () => Promise<void>;
  updateWorkflowURL: (workflowIid: string, nodeIds?: string[]) => Promise<void>;
  yaml: string;
  setYaml: Dispatch<SetStateAction<string>>;
  getDefinition: (
    yaml: string,
    options: WorkflowCompileOptions,
  ) => WorkflowDefinition;
}

export interface WorkflowContextProps {
  children: ReactNode;
}

export type TCb<T> = ((props: T) => void | undefined) & Cancelable;
