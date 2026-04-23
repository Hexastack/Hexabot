/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  CompiledStep,
  TaskDefinition,
  WorkflowDefinition,
  WorkflowEventMap,
} from "@hexabot-ai/agentic";
import type {
  FlowStepPath,
  WorkflowSelectionSnapshot,
} from "@hexabot-ai/graph";
import type { Workflow } from "@hexabot-ai/types";
import type { Cancelable } from "@mui/utils/debounce";
import type { UseMutateFunction } from "@tanstack/react-query";
import type { ResizeControlDirection } from "@xyflow/system";
import type { Dispatch, ReactNode, SetStateAction } from "react";

import { EntityType } from "@/services/types";
import type { IAction } from "@/types/action.types";
import type { EntityAttributes } from "@/types/base.types";

type WorkflowAttributes = EntityAttributes<EntityType.WORKFLOW>;

export interface IWorkflowContext {
  getWorkflowFromCache: (id: string) => Workflow | undefined;
  graphSelection: WorkflowSelectionSnapshot;
  selectedNodeIds: string[];
  setGraphSelection: (selection: WorkflowSelectionSnapshot) => void;
  selectedFlowId?: string;
  openSearchPanel: boolean;
  setOpenSearchPanel: Dispatch<SetStateAction<boolean>>;
  getQuery: (key: string) => string;
  direction?: ResizeControlDirection;
  setDirection?: Dispatch<SetStateAction<ResizeControlDirection>>;
  removeWorkflowParams: () => Promise<void>;
  updateWorkflowURL: (workflowIid: string, nodeIds?: string[]) => Promise<void>;
  yaml: string;
  updateDefinitionState: (nextDefinition: string | WorkflowDefinition) => void;
  workflow?: Workflow;
  workflows?: Workflow[];
  debouncedWorkflowUpdate: ((params: Partial<WorkflowAttributes>) => void) &
    Cancelable;
  updateWorkflow: UseMutateFunction<
    Workflow,
    Error,
    {
      id: string;
      params: Partial<WorkflowAttributes>;
    },
    Workflow
  >;
  updateDefinition: (definition: WorkflowDefinition) => void;
  persistDefinition: () => void;
  publishVersion: (versionId?: string) => void;
  unpublishVersion: () => void;
  restoreVersion: (parentVersion: string, definitionYml: string) => void;
  updateVersionMessage: (versionId: string, message: string) => void;
  isDefinitionDirty: boolean;
  isSaving: boolean;
  addActionStep: (action: IAction, insertPath?: FlowStepPath | null) => void;
  addConditionalStep: (insertPath?: FlowStepPath | null) => void;
  addLoopStep: (insertPath?: FlowStepPath | null) => void;
  addParallelStep: (insertPath?: FlowStepPath | null) => void;
  removeStepAtPath: (stepPath: FlowStepPath, nodeId?: string) => void;
  definition?: WorkflowDefinition;
  flow?: CompiledStep[];
  taskDefinitions: Record<string, TaskDefinition>;
  taskIds: string[];
}

export interface WorkflowContextProps {
  children: ReactNode;
  workflow?: Workflow;
}

export type WorkflowEvent<
  T extends keyof WorkflowEventMap = keyof WorkflowEventMap,
> = T extends `${string}:${infer Rest}` ? Rest : T;

export type SubscribeWorkflowProps =
  WorkflowEventMap[keyof WorkflowEventMap] & {
    workflowEvent: WorkflowEvent;
    workflowId?: string;
    t: number;
  };

export type NodeExecutionState =
  | "idle"
  | "running"
  | "start"
  | "finish"
  | "suspended"
  | "error";
