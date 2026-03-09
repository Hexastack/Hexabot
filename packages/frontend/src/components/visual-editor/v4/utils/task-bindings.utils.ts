/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { TaskDefinition } from "@hexabot-ai/agentic";

export const toBindingRefs = (value: unknown, multiple: boolean): string[] => {
  if (multiple) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((entry): entry is string => typeof entry === "string")
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const normalized = value.trim();

    return normalized ? [normalized] : [];
  }

  // Be tolerant with invalid local state and recover to a string list.
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .filter(Boolean);
};

const withTaskBindingRefs = (
  taskDefinition: TaskDefinition,
  bindingKind: string,
  refs: string[],
  multiple: boolean,
): TaskDefinition => {
  const nextBindings: Record<string, string | string[]> = {
    ...(taskDefinition.bindings ?? {}),
  };

  if (refs.length > 0) {
    nextBindings[bindingKind] = multiple ? refs : refs[0];
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

export const setTaskBindingRefs = (
  taskDefinition: TaskDefinition,
  bindingKind: string,
  refs: string[],
  multiple: boolean,
): TaskDefinition => withTaskBindingRefs(taskDefinition, bindingKind, refs, multiple);

export const mountTaskBindingRef = (
  taskDefinition: TaskDefinition,
  bindingKind: string,
  bindingRef: string,
  multiple: boolean,
): TaskDefinition => {
  const currentRefs = toBindingRefs(taskDefinition.bindings?.[bindingKind], multiple);

  if (multiple) {
    if (currentRefs.includes(bindingRef)) {
      return taskDefinition;
    }

    return setTaskBindingRefs(
      taskDefinition,
      bindingKind,
      [...currentRefs, bindingRef],
      true,
    );
  }

  if (currentRefs.length === 1 && currentRefs[0] === bindingRef) {
    return taskDefinition;
  }

  return setTaskBindingRefs(taskDefinition, bindingKind, [bindingRef], false);
};

export const unmountTaskBindingRef = (
  taskDefinition: TaskDefinition,
  bindingKind: string,
  bindingRef: string,
  multiple: boolean,
): TaskDefinition => {
  const currentRefs = toBindingRefs(taskDefinition.bindings?.[bindingKind], multiple);

  if (!currentRefs.includes(bindingRef)) {
    return taskDefinition;
  }

  const nextRefs = currentRefs.filter((refName) => refName !== bindingRef);

  return setTaskBindingRefs(taskDefinition, bindingKind, nextRefs, multiple);
};
