/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  compileWorkflow,
  validateWorkflow,
  WorkflowCompileOptions,
  WorkflowDefinition,
} from "@hexabot-ai/agentic";

export const useDefinition = () => ({
  getDefinition: (
    yaml: string,
    options: WorkflowCompileOptions,
  ): WorkflowDefinition => {
    const validation = validateWorkflow(yaml);

    if (!validation.success) {
      throw new Error(
        `Workflow validation failed: ${validation.errors.join("; ")}`,
      );
    }
    const { definition } = compileWorkflow(validation.data, options);

    return definition;
  },
});
