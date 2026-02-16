/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  PropsWithChildren,
  createContext,
  useContext,
  useMemo,
} from "react";

import { useFind } from "@/hooks/crud/useFind";
import { EntityType } from "@/services/types";
import type { IAction } from "@/types/action.types";

type WorkflowActionsCatalogContextValue = {
  actions: IAction[];
  actionsByName: Map<string, IAction>;
  isLoading: boolean;
  isFetching: boolean;
};

const WorkflowActionsCatalogContext =
  createContext<WorkflowActionsCatalogContextValue | null>(null);

type WorkflowActionsProviderProps = PropsWithChildren<{
  workflowType?: string;
}>;

export const WorkflowActionsProvider = ({
  children,
  workflowType,
}: WorkflowActionsProviderProps) => {
  const {
    data: actions = [],
    isLoading,
    isFetching,
  } = useFind(
    { entity: EntityType.WORKFLOW_ACTIONS },
    { hasCount: false },
    {
      routeParams: workflowType ? { type: workflowType } : undefined,
      enabled: Boolean(workflowType),
    },
  );
  const actionsByName = useMemo(
    () =>
      new Map<string, IAction>(
        actions.map((action) => [action.name, action]),
      ),
    [actions],
  );
  const value = useMemo(
    () => ({ actions, actionsByName, isLoading, isFetching }),
    [actions, actionsByName, isLoading, isFetching],
  );

  return (
    <WorkflowActionsCatalogContext.Provider value={value}>
      {children}
    </WorkflowActionsCatalogContext.Provider>
  );
};

export const useWorkflowActionsCatalog = () => {
  const context = useContext(WorkflowActionsCatalogContext);

  if (!context) {
    throw new Error(
      "useWorkflowActionsCatalog must be used within a WorkflowActionsProvider",
    );
  }

  return context;
};
