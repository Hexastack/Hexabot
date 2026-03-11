/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { toSnakeCase, type WorkflowDefinition } from "@hexabot-ai/agentic";

const BINDING_NAME_REGEX = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

export const normalizeBindingName = (value: string): string => {
  const normalized = toSnakeCase(value.trim());

  if (!normalized || !BINDING_NAME_REGEX.test(normalized)) {
    return "";
  }

  return normalized;
};

export const createUniqueBindingName = (
  baseName: string,
  defs: WorkflowDefinition["defs"] | undefined,
): string => {
  const nextDefs = defs ?? {};
  let candidate = baseName;
  let suffix = 2;

  while (Object.prototype.hasOwnProperty.call(nextDefs, candidate)) {
    candidate = `${baseName}_${suffix}`;
    suffix += 1;
  }

  return candidate;
};
