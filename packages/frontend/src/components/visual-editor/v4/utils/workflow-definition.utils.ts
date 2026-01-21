/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  type WorkflowDefinition,
  isSnakeCaseName,
  toSnakeCase,
} from "@hexabot-ai/agentic";

import type { IWorkflow } from "@/types/workfow.types";

import {
  DEFAULT_WORKFLOW_NAME,
  DEFAULT_WORKFLOW_VERSION,
} from "../constants/workflow.constants";
/**
 * Build a minimal workflow definition with defaults and optional metadata.
 */
export const createBaseDefinition = (
  workflow?: IWorkflow,
): WorkflowDefinition => ({
  workflow: {
    name: workflow?.name ?? DEFAULT_WORKFLOW_NAME,
    version: workflow?.version ?? DEFAULT_WORKFLOW_VERSION,
    ...(workflow?.description?.trim()
      ? { description: workflow.description.trim() }
      : {}),
  },
  tasks: {},
  flow: [],
  outputs: {},
});

/**
 * Generate a unique task name derived from the action name.
 */
export const createTaskName = (
  actionName: string,
  tasks: WorkflowDefinition["tasks"],
) => {
  const snakeCaseName = toSnakeCase(actionName);
  const baseName = isSnakeCaseName(snakeCaseName)
    ? snakeCaseName
    : snakeCaseName
      ? `${snakeCaseName}_task`
      : "new_task";
  const normalizedBase = isSnakeCaseName(baseName) ? baseName : "new_task";
  let candidate = normalizedBase;
  let suffix = 2;

  while (Object.prototype.hasOwnProperty.call(tasks, candidate)) {
    candidate = `${normalizedBase}_${suffix}`;
    suffix += 1;
  }

  return candidate;
};
