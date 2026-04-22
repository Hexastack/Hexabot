/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  WorkflowType,
  type Workflow as SharedWorkflow,
} from "@hexabot-ai/types";
import type { ResizeControlDirection } from "@xyflow/system";
import type { JSONSchema7 as JsonSchema } from "json-schema";

export { WorkflowType };

type SharedWorkflowCoreAttributes = Pick<
  SharedWorkflow,
  "name" | "description" | "schedule" | "type"
>;

export type IWorkflowAttributes = SharedWorkflowCoreAttributes & {
  builtin?: boolean;
  inputSchema?: JsonSchema;
  zoom?: number;
  x?: number;
  y?: number;
  direction?: ResizeControlDirection;
};

export interface IWorkflowSubmitAttributes extends IWorkflowAttributes {
  definitionYml?: string;
}

export interface IWorkflowFilters {
  name: string;
  version: string;
  description: string;
  type: WorkflowType;
  runAfterMs: number;
}
