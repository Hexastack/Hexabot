/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { IsUUID, ValidationOptions } from 'class-validator';

/**
 * Validates that a value is a version 4 UUID while allowing custom validation options.
 *
 * @param validationOptions - Optional class-validator options (e.g. message, each).
 */
export function IsUUIDv4(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return IsUUID('4', validationOptions);
}
