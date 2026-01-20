/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { FlowStep, WorkflowDefinition } from './dsl.types';

export type FlowStepPath = Array<string | number>;

/**
 * Resolve a nested value from a workflow definition by path.
 */
export const getValueAtPath = (value: unknown, path: FlowStepPath) => {
  return path.reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined) {
      return undefined;
    }
    if (Array.isArray(acc)) {
      return typeof key === 'number' ? acc[key] : undefined;
    }
    if (typeof acc === 'object') {
      return (acc as Record<string, unknown>)[String(key)];
    }

    return undefined;
  }, value);
};

/**
 * Create a new value with a nested path updated immutably.
 */
export const setValueAtPath = <T>(
  value: T,
  path: FlowStepPath,
  nextValue: unknown,
): T => {
  if (path.length === 0) {
    return nextValue as T;
  }

  const [key, ...rest] = path;

  if (Array.isArray(value)) {
    if (typeof key !== 'number') {
      return value;
    }
    const nextArray = [...value];

    nextArray[key] = setValueAtPath(value[key], rest, nextValue);

    return nextArray as unknown as T;
  }

  if (value && typeof value === 'object') {
    return {
      ...(value as Record<string, unknown>),
      [String(key)]: setValueAtPath(
        (value as Record<string, unknown>)[String(key)],
        rest,
        nextValue,
      ),
    } as T;
  }

  return value;
};

/**
 * Remove a flow step from the definition at the given path, if valid.
 */
export const removeStepAtPath = (
  definition: WorkflowDefinition,
  stepPath: FlowStepPath,
) => {
  if (!stepPath.length) {
    return null;
  }

  const removeIndex = stepPath[stepPath.length - 1];

  if (typeof removeIndex !== 'number') {
    return null;
  }

  const stepsPath = stepPath.slice(0, -1);
  const steps = getValueAtPath(definition, stepsPath);

  if (!Array.isArray(steps)) {
    return null;
  }

  if (removeIndex < 0 || removeIndex >= steps.length) {
    return null;
  }

  const nextSteps = [...steps];

  nextSteps.splice(removeIndex, 1);

  return setValueAtPath(definition, stepsPath, nextSteps);
};

/**
 * Insert a flow step into the definition at the given path, if valid.
 */
export const insertStepAtPath = (
  definition: WorkflowDefinition,
  insertPath: FlowStepPath,
  step: FlowStep,
) => {
  if (!insertPath.length) {
    return null;
  }

  const insertIndex = insertPath[insertPath.length - 1];

  if (typeof insertIndex !== 'number') {
    return null;
  }

  const stepsPath = insertPath.slice(0, -1);
  const steps = getValueAtPath(definition, stepsPath);

  if (!Array.isArray(steps)) {
    return null;
  }

  const nextSteps = [...steps];
  const safeIndex = Math.min(Math.max(insertIndex, 0), nextSteps.length);

  nextSteps.splice(safeIndex, 0, step);

  return setValueAtPath(definition, stepsPath, nextSteps);
};
