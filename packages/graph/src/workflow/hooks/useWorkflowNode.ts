/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useContext } from "react";

import { WorkflowNodeContext } from "../contexts/workflow-node.context";
import {
  ENodeType,
  type IWorkflowNodeContext,
} from "../types/workflow-node.types";

export const useWorkflowNode = <T extends ENodeType = ENodeType>() => {
  const context = useContext(WorkflowNodeContext);

  if (context === null) {
    throw new Error(
      "useWorkflowNode must be used within an WorkflowNodeProvider",
    );
  }

  return context as IWorkflowNodeContext<T>;
};
