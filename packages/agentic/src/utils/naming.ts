/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export const SNAKE_CASE_REGEX = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

export type WorkflowEntity = 'action' | 'workflow' | 'predicate';

/**
 * Checks whether the provided string is snake_case compliant.
 *
 * @param value - Text to evaluate.
 * @returns `true` when the value is snake_case; otherwise `false`.
 */
export const isSnakeCaseName = (value: string): boolean =>
  SNAKE_CASE_REGEX.test(value);

/**
 * Converts arbitrary text into snake_case for use in workflow entities.
 *
 * @param value - Input text that should be converted.
 * @returns Snake cased version of the input.
 */
export function toSnakeCase(value: string): string {
  if (!value) {
    return '';
  }

  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}
