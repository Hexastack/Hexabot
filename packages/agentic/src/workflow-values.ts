/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import jsonata from 'jsonata';

import type { Settings } from './dsl.types';
import type {
  CompiledMapping,
  CompiledValue,
  EvaluationScope,
} from './workflow-types';

/** Basic object guard that rejects arrays and null. */
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Prepares a workflow value for evaluation.
 * Strings prefixed with `=` are treated as JSONata expressions; everything else is a literal.
 */
export const compileValue = (value: unknown): CompiledValue => {
  if (typeof value === 'string' && value.startsWith('=')) {
    const expression = jsonata(value.slice(1));

    return { kind: 'expression', source: value, expression };
  }

  return { kind: 'literal', value };
};

/**
 * Evaluate a compiled value against the current workflow scope.
 * Expressions are executed via JSONata with the scope exposed as variables; `context`
 * represents the workflow context state, not the context instance itself.
 */
export const evaluateValue = async (
  compiled: CompiledValue,
  scope: EvaluationScope,
): Promise<unknown> => {
  if (compiled.kind === 'literal') {
    return compiled.value;
  }

  return compiled.expression.evaluate(
    {},
    {
      input: scope.input,
      context: scope.context,
      memory: scope.memory,
      output: scope.output,
      iteration: scope.iteration,
      accumulator: scope.accumulator,
      result: scope.result,
    },
  );
};

/**
 * Evaluate all entries of a compiled mapping, returning a plain object.
 * Missing mappings resolve to an empty object.
 */
export const evaluateMapping = async (
  mapping: CompiledMapping | undefined,
  scope: EvaluationScope,
): Promise<Record<string, unknown>> => {
  if (!mapping) {
    return {};
  }

  const result: Record<string, unknown> = {};

  for (const [key, compiled] of Object.entries(mapping)) {
    result[key] = await evaluateValue(compiled, scope);
  }

  return result;
};

/**
 * Deep-merge workflow settings, preferring non-undefined overrides.
 * Nested objects are merged recursively to preserve defaults.
 */
export const mergeSettings = (
  base?: Partial<Settings>,
  override?: Partial<Settings>,
): Partial<Settings> => {
  const merged: Record<string, unknown> = { ...(base ?? {}) };

  if (!override) {
    return merged;
  }

  for (const [key, value] of Object.entries(override)) {
    const previous = merged[key];

    if (isPlainObject(previous) && isPlainObject(value)) {
      merged[key] = mergeSettings(
        previous as Partial<Settings>,
        value as Partial<Settings>,
      );
    } else if (value !== undefined) {
      merged[key] = value;
    }
  }

  return merged;
};
