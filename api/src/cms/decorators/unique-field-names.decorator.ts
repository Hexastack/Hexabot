/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { registerDecorator, ValidationOptions } from 'class-validator';

import { UniqueFieldNamesConstraint } from '../validators/validate-unique-names.validator';

export function UniqueFieldNames(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: UniqueFieldNamesConstraint,
    });
  };
}
