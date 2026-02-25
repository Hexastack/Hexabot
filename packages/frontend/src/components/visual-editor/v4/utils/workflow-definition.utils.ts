/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  DEFAULT_RETRY_SETTINGS,
  DEFAULT_TIMEOUT_MS,
  type WorkflowDefinition,
  isSnakeCaseName,
  toSnakeCase,
} from "@hexabot-ai/agentic";

/**
 * Build a minimal workflow definition with defaults and optional metadata.
 */
export const createBaseDefinition = (): WorkflowDefinition => ({
  defaults: {
    settings: {
      timeout_ms: DEFAULT_TIMEOUT_MS,
      retries: { ...DEFAULT_RETRY_SETTINGS },
    },
  },
  tasks: {},
  flow: [],
  outputs: {},
});

/**
 * Normalize user input into a valid snake_case task identifier.
 */
export const normalizeTaskName = (value: string): string => {
  const snakeCaseName = toSnakeCase(value.trim());

  if (!snakeCaseName) {
    return "";
  }

  if (isSnakeCaseName(snakeCaseName)) {
    return snakeCaseName;
  }

  const fallbackName = `${snakeCaseName}_task`;

  return isSnakeCaseName(fallbackName) ? fallbackName : "";
};

/**
 * Generate a unique task name derived from the action name.
 */
export const createTaskName = (
  actionName: string,
  tasks: WorkflowDefinition["tasks"],
) => {
  const baseName = normalizeTaskName(actionName) || "new_task";
  const normalizedBase = isSnakeCaseName(baseName) ? baseName : "new_task";
  let candidate = normalizedBase;
  let suffix = 2;

  while (Object.prototype.hasOwnProperty.call(tasks, candidate)) {
    candidate = `${normalizedBase}_${suffix}`;
    suffix += 1;
  }

  return candidate;
};
