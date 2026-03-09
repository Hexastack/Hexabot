/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  JsonValue,
  type WorkflowDefinition,
} from "@hexabot-ai/agentic";

import {
  mountTaskBindingRef,
  setTaskBindingRefs,
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
): Record<string, JsonValue> | undefined => {
  if (!value || Object.keys(value).length === 0) {
    return undefined;
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
    ...(normalizedSettings ? { settings: normalizedSettings } : {}),
  };
};

export type CreateToolBindingDefinitionMutationArgs = {
  taskName: string;
  bindingKind: string;
  bindingName: string;
  actionName: string;
  description?: string;
  settings?: Record<string, unknown>;
};

export const createToolBindingDefinitionMutation = (
  definition: WorkflowDefinition,
  {
    taskName,
    bindingKind,
    bindingName,
    actionName,
    description,
    settings,
  }: CreateToolBindingDefinitionMutationArgs,
): WorkflowDefinition => {
  const taskDefinition = definition.tasks[taskName];

  if (!taskDefinition) {
    return definition;
  }

  const currentDefs = definition.defs ?? {};

  if (Object.prototype.hasOwnProperty.call(currentDefs, bindingName)) {
    return definition;
  }

  const nextTaskDefinition = mountTaskBindingRef(
    taskDefinition,
    bindingKind,
    bindingName,
    true,
  );

  if (nextTaskDefinition === taskDefinition) {
    return definition;
  }

  return {
    ...definition,
    defs: {
      ...currentDefs,
      [bindingName]: createToolDefinition({ actionName, description, settings }),
    },
    tasks: {
      ...definition.tasks,
      [taskName]: nextTaskDefinition,
    },
  };
};

export type UpdateToolBindingDefinitionMutationArgs = {
  taskName: string;
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

  nextDefs[nextBindingName] = createToolDefinition({
    actionName,
    description,
    settings,
  });

  const nextTasks = Object.fromEntries(
    Object.entries(definition.tasks).map(([taskName, taskDefinition]) => {
      const refs = toBindingRefs(taskDefinition.bindings?.[bindingKind], true);

      if (!refs.includes(currentBindingName)) {
        return [taskName, taskDefinition];
      }

      const replacedRefs = refs.map((ref) =>
        ref === currentBindingName ? nextBindingName : ref,
      );
      const dedupedRefs = Array.from(new Set(replacedRefs));

      return [
        taskName,
        setTaskBindingRefs(taskDefinition, bindingKind, dedupedRefs, true),
      ];
    }),
  ) as WorkflowDefinition["tasks"];

  return {
    ...definition,
    defs: nextDefs,
    tasks: nextTasks,
  };
};
