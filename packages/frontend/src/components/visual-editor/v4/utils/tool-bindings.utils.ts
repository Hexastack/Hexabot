/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  type DefDefinition,
  JsonValue,
  type WorkflowDefinition,
} from "@hexabot-ai/agentic";

import {
  mountDefBindingRef,
  setDefBindingRefs,
  toBindingRefs,
} from "./task-bindings.utils";

export const TOOL_BINDING_KIND = "tools";

type WorkflowDefs = NonNullable<WorkflowDefinition["defs"]>;
const sanitizeToolDescription = (value?: string): string | undefined => {
  const normalized = value?.trim() ?? "";

  return normalized || undefined;
};
const sanitizeToolSettings = (
  value?: Record<string, unknown>,
): Record<string, JsonValue> => {
  if (!value || Object.keys(value).length === 0) {
    return {};
  }

  return value as Record<string, JsonValue>;
};
const createToolDefinition = ({
  actionName,
  description,
  settings,
}: {
  actionName: string;
  description?: string;
  settings?: Record<string, unknown>;
}): WorkflowDefs[string] => {
  const normalizedDescription = sanitizeToolDescription(description);
  const normalizedSettings = sanitizeToolSettings(settings);

  return {
    kind: TOOL_BINDING_KIND,
    action: actionName,
    ...(normalizedDescription ? { description: normalizedDescription } : {}),
    settings: normalizedSettings,
  };
};

export type CreateToolBindingDefinitionMutationArgs = {
  ownerDefName: string;
  bindingKind: string;
  bindingName: string;
  actionName: string;
  description?: string;
  settings?: Record<string, unknown>;
};

export const createToolBindingDefinitionMutation = (
  definition: WorkflowDefinition,
  {
    ownerDefName,
    bindingKind,
    bindingName,
    actionName,
    description,
    settings,
  }: CreateToolBindingDefinitionMutationArgs,
): WorkflowDefinition => {
  const ownerDefinition = definition.defs[ownerDefName];

  if (!ownerDefinition) {
    return definition;
  }

  const currentDefs = definition.defs ?? {};

  if (Object.prototype.hasOwnProperty.call(currentDefs, bindingName)) {
    return definition;
  }

  const nextOwnerDefinition = mountDefBindingRef(
    ownerDefinition,
    bindingKind,
    bindingName,
    true,
  );

  if (nextOwnerDefinition === ownerDefinition) {
    return definition;
  }

  return {
    ...definition,
    defs: {
      ...currentDefs,
      [bindingName]: createToolDefinition({
        actionName,
        description,
        settings,
      }),
      [ownerDefName]: nextOwnerDefinition,
    },
  };
};

export type UpdateToolBindingDefinitionMutationArgs = {
  ownerDefName: string;
  bindingKind: string;
  currentBindingName: string;
  nextBindingName: string;
  actionName: string;
  description?: string;
  settings?: Record<string, unknown>;
};

export const updateToolBindingDefinitionMutation = (
  definition: WorkflowDefinition,
  {
    bindingKind,
    currentBindingName,
    nextBindingName,
    actionName,
    description,
    settings,
  }: UpdateToolBindingDefinitionMutationArgs,
): WorkflowDefinition => {
  const currentDefs = definition.defs ?? {};
  const currentDef = currentDefs[currentBindingName];

  if (!currentDef) {
    return definition;
  }

  if (
    currentBindingName !== nextBindingName &&
    Object.prototype.hasOwnProperty.call(currentDefs, nextBindingName)
  ) {
    return definition;
  }

  const nextDefs = { ...currentDefs };

  if (currentBindingName !== nextBindingName) {
    delete nextDefs[currentBindingName];
  }

  const nextToolDefinition = createToolDefinition({
    actionName,
    description,
    settings,
  }) as DefDefinition;
  const currentBindings = currentDef.bindings;

  nextDefs[nextBindingName] = {
    ...nextToolDefinition,
    ...(currentBindings ? { bindings: currentBindings } : {}),
  };

  const nextDefsWithRenamedRefs = Object.fromEntries(
    Object.entries(nextDefs).map(([defName, defDefinition]) => {
      const refs = toBindingRefs(defDefinition.bindings?.[bindingKind], true);

      if (!refs.includes(currentBindingName)) {
        return [defName, defDefinition];
      }

      const replacedRefs = refs.map((ref) =>
        ref === currentBindingName ? nextBindingName : ref,
      );
      const dedupedRefs = Array.from(new Set(replacedRefs));

      return [
        defName,
        setDefBindingRefs(defDefinition, bindingKind, dedupedRefs, true),
      ];
    }),
  ) as WorkflowDefinition["defs"];

  return {
    ...definition,
    defs: nextDefsWithRenamedRefs,
  };
};
