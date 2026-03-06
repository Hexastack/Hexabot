/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { JSONSchema } from "monaco-yaml";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useMemo,
} from "react";

import { useTanstackQuery } from "@/hooks/crud/useTanstack";
import { useApiClient } from "@/hooks/useApiClient";

type WorkflowBindingsCatalog = Record<string, JSONSchema>;
type WorkflowBindingsCatalogContextValue = {
  bindings: WorkflowBindingsCatalog;
  bindingsByName: Map<string, JSONSchema>;
  isLoading: boolean;
  isFetching: boolean;
};

const WorkflowBindingsCatalogContext =
  createContext<WorkflowBindingsCatalogContextValue | null>(null);

export const WorkflowBindingsProvider = ({ children }: PropsWithChildren) => {
  const { apiClient } = useApiClient();
  const {
    data: bindings = {},
    isLoading,
    isFetching,
  } = useTanstackQuery({
    queryKey: ["workflow-bindings"],
    queryFn: async () => {
      return await apiClient.getWorkflowBindings<WorkflowBindingsCatalog>();
    },
  });
  const bindingsByName = useMemo(
    () =>
      new Map<string, JSONSchema>(
        Object.entries(bindings).map(([name, schema]) => [name, schema]),
      ),
    [bindings],
  );
  const value = useMemo(
    () => ({ bindings, bindingsByName, isLoading, isFetching }),
    [bindings, bindingsByName, isLoading, isFetching],
  );
  
  return (
    <WorkflowBindingsCatalogContext.Provider value={value}>
      {children}
    </WorkflowBindingsCatalogContext.Provider>
  );
};

export const useWorkflowBindingsCatalog = () => {
  const context = useContext(WorkflowBindingsCatalogContext);

  if (!context) {
    throw new Error(
      "useWorkflowBindingsCatalog must be used within a WorkflowBindingsProvider",
    );
  }

  return context;
};
