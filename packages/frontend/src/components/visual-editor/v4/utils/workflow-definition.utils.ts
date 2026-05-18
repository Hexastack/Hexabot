/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  compileWorkflow,
  DEFAULT_RETRY_SETTINGS,
  DEFAULT_TIMEOUT_MS,
  extractTaskDefinitions,
  validateWorkflow,
  type CompiledStep,
  type WorkflowCompileOptions,
  type WorkflowDefinition,
} from "@hexabot-ai/agentic";
import { parse as parseYaml } from "yaml";

import { isRecord } from "@/utils/object";

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
  defs: {},
  flow: [],
  outputs: {},
});

export const extractTaskIdsFromYaml = (yaml: string): string[] => {
  try {
    const parsed = parseYaml(yaml);

    if (!isRecord(parsed) || !isRecord(parsed.defs)) {
      return [];
    }

    return Object.keys(
      extractTaskDefinitions(parsed.defs as WorkflowDefinition["defs"]),
    ).sort();
  } catch {
    return [];
  }
};

export const getDefinition = (
  yaml: string,
  options: WorkflowCompileOptions,
): { definition: WorkflowDefinition; flow: CompiledStep[] } => {
  const actionValidationMetadata = Object.fromEntries(
    Object.entries(options.actions).map(([actionName, actionDefinition]) => [
      actionName,
      {
        supportedBindings: actionDefinition.supportedBindings ?? [],
      },
    ]),
  );
  const validation = validateWorkflow(yaml, {
    bindingKinds: options.bindingKinds,
    actions: actionValidationMetadata,
  });

  if (!validation.success) {
    throw new Error(
      `Workflow validation failed: ${validation.errors.join("; ")}`,
    );
  }

  const { definition, flow } = compileWorkflow(validation.data, options);

  return { definition, flow };
};
