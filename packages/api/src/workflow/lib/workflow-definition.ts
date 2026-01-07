/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowDefinition, validateWorkflow } from '@hexabot-ai/agentic';

export const parseWorkflowDefinition = (
  definitionYaml: string,
): WorkflowDefinition => {
  const validation = validateWorkflow(definitionYaml);

  if (!validation.success) {
    throw new Error(`Invalid workflow YAML: ${validation.errors.join('; ')}`);
  }

  return validation.data;
};
