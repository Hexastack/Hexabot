/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { PropsWithChildren } from "react";
import { useMemo } from "react";

import { JsonataGlobalsSchemaProvider } from "@/app-components/inputs/JsonataFormulaField";
import { useWorkflowActionsCatalog } from "@/contexts/workflow-actions.context";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { EntityType } from "@/services/types";
import type { IMemoryDefinition } from "@/types/memory-definition.types";

import { useWorkflow } from "../hooks/useWorkflow";
import { buildJsonataGlobalsSchema } from "../utils/jsonata-globals-schema.utils";

export const WorkflowJsonataGlobalsSchemaProvider = ({
  children,
}: PropsWithChildren) => {
  const { definition, workflow } = useWorkflow();
  const { actionsByName } = useWorkflowActionsCatalog();
  const getMemoryDefinitionFromCache = useGetFromCache(
    EntityType.MEMORY_DEFINITION,
  );
  const memoryDefinitions = useMemo(
    () =>
      (workflow?.memoryDefinitions ?? [])
        .map((memoryDefinitionId) => getMemoryDefinitionFromCache(memoryDefinitionId))
        .filter(
          (memoryDefinition): memoryDefinition is IMemoryDefinition =>
            Boolean(memoryDefinition),
        ),
    [workflow?.memoryDefinitions, getMemoryDefinitionFromCache],
  );
  const globalsSchema = useMemo(
    () =>
      buildJsonataGlobalsSchema({
        definition,
        actionsByName,
        memoryDefinitions,
        inputSchema: workflow?.inputSchema,
      }),
    [actionsByName, definition, memoryDefinitions, workflow?.inputSchema],
  );

  return (
    <JsonataGlobalsSchemaProvider globalsSchema={globalsSchema}>
      {children}
    </JsonataGlobalsSchemaProvider>
  );
};
