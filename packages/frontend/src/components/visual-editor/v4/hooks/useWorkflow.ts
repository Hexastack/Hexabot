/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useContext } from "react";

import { WorkflowContext } from "../contexts/workflow.context";
import { IWorkflowContext } from "../types/workflow.types";

export const useWorkflow = (): IWorkflowContext => {
  const context = useContext(WorkflowContext);

  if (!context) {
    throw new Error("useWorkflow must be used within an WorkflowContext");
  }

  return context;
};
