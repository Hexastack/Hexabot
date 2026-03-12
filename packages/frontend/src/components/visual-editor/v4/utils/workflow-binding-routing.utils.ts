/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { WorkflowDefinition } from "@hexabot-ai/agentic";

import type { WorkflowBindingDefinition } from "@/contexts/workflow-bindings.context";

import { toBindingRefs } from "./task-bindings.utils";
import { TOOL_BINDING_KIND } from "./tool-bindings.utils";

export const isNonToolBindingKind = (
  bindingKind: string,
  bindingsByName: ReadonlyMap<string, WorkflowBindingDefinition>,
): boolean => {
  return bindingKind !== TOOL_BINDING_KIND && bindingsByName.has(bindingKind);
};

type GetDisabledBindingRefsArgs = {
  definition: WorkflowDefinition;
  ownerDefName: string;
  bindingKind: string;
  bindingsByName: ReadonlyMap<string, WorkflowBindingDefinition>;
};

export const getDisabledBindingRefs = ({
  definition,
  ownerDefName,
  bindingKind,
  bindingsByName,
}: GetDisabledBindingRefsArgs): string[] => {
  if (!isNonToolBindingKind(bindingKind, bindingsByName)) {
    return [];
  }

  const bindingDefinition = bindingsByName.get(bindingKind);

  if (!bindingDefinition) {
    return [];
  }

  const multiple = bindingDefinition.multiple ?? true;

  if (!multiple) {
    return [];
  }

  const ownerDefinition = definition.defs[ownerDefName];

  if (!ownerDefinition) {
    return [];
  }

  return toBindingRefs(ownerDefinition.bindings?.[bindingKind], true);
};
