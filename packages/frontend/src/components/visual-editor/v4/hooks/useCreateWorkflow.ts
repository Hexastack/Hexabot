/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowCompileOptions } from "@hexabot-ai/agentic";

import { useCreate } from "@/hooks/crud/useCreate";
import { EntityType } from "@/services/types";

import { useWorkflow } from "./useWorkflow";

export const useCreateWorkflow = () => {
  const { selectedFlowId, updateWorkflowURL, getDefinition } = useWorkflow();
  const { mutate: createWorkflow } = useCreate(EntityType.WORKFLOW);

  return {
    createWorkflow: (yaml: string, options: WorkflowCompileOptions) => {
      const definition = getDefinition(yaml, options);

      if (!selectedFlowId && definition) {
        createWorkflow(
          {
            definitionYaml: yaml,
            definition,
            ...definition.workflow,
          },
          {
            onSuccess(data) {
              updateWorkflowURL(data.id);
            },
          },
        );
      }
    },
  };
};
