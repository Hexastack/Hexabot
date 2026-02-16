/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { PropsWithChildren } from "react";
import { useMemo } from "react";

import { JsonataGlobalsSchemaProvider } from "@/app-components/inputs/JsonataFormulaField";
import { useWorkflowActionsCatalog } from "@/contexts/workflow-actions.context";

import { useWorkflow } from "../hooks/useWorkflow";
import { buildJsonataGlobalsSchema } from "../utils/jsonata-globals-schema.utils";

export const WorkflowJsonataGlobalsSchemaProvider = ({
  children,
}: PropsWithChildren) => {
  const { definition } = useWorkflow();
  const { actionsByName } = useWorkflowActionsCatalog();
  const globalsSchema = useMemo(
    () =>
      buildJsonataGlobalsSchema({
        definition,
        actionsByName,
      }),
    [actionsByName, definition],
  );

  return (
    <JsonataGlobalsSchemaProvider globalsSchema={globalsSchema}>
      {children}
    </JsonataGlobalsSchemaProvider>
  );
};
