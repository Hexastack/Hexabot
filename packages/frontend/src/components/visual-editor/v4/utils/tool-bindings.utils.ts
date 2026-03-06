/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  JsonValue,
  type TaskDefinition,
  toSnakeCase,
  type WorkflowDefinition,
} from "@hexabot-ai/agentic";

export const TOOL_BINDING_KIND = "tools";

const TOOL_NAME_REGEX = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

type WorkflowDefs = NonNullable<WorkflowDefinition["defs"]>;

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .filter(Boolean);
};
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
const withTaskBindingRefs = (
  taskDefinition: TaskDefinition,
  bindingKind: string,
  refs: string[],
): TaskDefinition => {
  const nextBindings = { ...(taskDefinition.bindings ?? {}) };

  if (refs.length > 0) {
    nextBindings[bindingKind] = refs;
  } else {
    delete nextBindings[bindingKind];
  }

  if (Object.keys(nextBindings).length === 0) {
    const { bindings: _bindings, ...taskWithoutBindings } = taskDefinition;

    return taskWithoutBindings;
  }

  return {
    ...taskDefinition,
    bindings: nextBindings,
  };
};

export const normalizeToolBindingName = (value: string): string => {
  const normalized = toSnakeCase(value.trim());

  if (!normalized || !TOOL_NAME_REGEX.test(normalized)) {
    return "";
  }

  return normalized;
};

export const createUniqueToolBindingName = (
  actionName: string,
  defs: WorkflowDefinition["defs"] | undefined,
): string => {
  const nextDefs = defs ?? {};
  const baseName = normalizeToolBindingName(actionName) || "tool";
  let candidate = baseName;
  let suffix = 2;

  while (Object.prototype.hasOwnProperty.call(nextDefs, candidate)) {
    candidate = `${baseName}_${suffix}`;
    suffix += 1;
  }

  return candidate;
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

  const currentRefs = toStringArray(taskDefinition.bindings?.[bindingKind]);

  if (currentRefs.includes(bindingName)) {
    return definition;
  }

  const nextTaskDefinition = withTaskBindingRefs(taskDefinition, bindingKind, [
    ...currentRefs,
    bindingName,
  ]);

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
      const refs = toStringArray(taskDefinition.bindings?.[bindingKind]);

      if (!refs.includes(currentBindingName)) {
        return [taskName, taskDefinition];
      }

      const replacedRefs = refs.map((ref) =>
        ref === currentBindingName ? nextBindingName : ref,
      );
      const dedupedRefs = Array.from(new Set(replacedRefs));

      return [
        taskName,
        withTaskBindingRefs(taskDefinition, bindingKind, dedupedRefs),
      ];
    }),
  ) as WorkflowDefinition["tasks"];

  return {
    ...definition,
    defs: nextDefs,
    tasks: nextTasks,
  };
};
