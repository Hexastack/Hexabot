/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowDefinition, validateWorkflow } from '@hexabot-ai/agentic';

import { bindingKinds } from '@/actions/runtime-bindings';

export const parseWorkflowDefinition = (
  definitionYaml: string,
): WorkflowDefinition => {
  // @todo: we should rather use compile in order to check if
  // actions provided in the yml matches the workflow type (workflowTypes)
  const validation = validateWorkflow(definitionYaml, {
    bindingKinds,
  });

  if (!validation.success) {
    throw new Error(`Invalid workflow YAML: ${validation.errors.join('; ')}`);
  }

  return validation.data;
};
