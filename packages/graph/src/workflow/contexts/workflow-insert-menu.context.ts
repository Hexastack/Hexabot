/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createContext, useContext } from "react";

import type { OnOpenInsertMenu } from "../types/workflow-path.types";

export type WorkflowInsertMenuContextValue = {
  onOpenInsertMenu?: OnOpenInsertMenu;
  showEdgeInsertControls: boolean;
};

export const WorkflowInsertMenuContext =
  createContext<WorkflowInsertMenuContextValue>({
    showEdgeInsertControls: true,
  });

export const useWorkflowInsertMenu = (): WorkflowInsertMenuContextValue =>
  useContext(WorkflowInsertMenuContext);
