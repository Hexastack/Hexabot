/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { Pattern, patternSchema } from '../schemas/types/pattern';

export function isPatternList(patterns: Pattern[]) {
  if (!Array.isArray(patterns)) {
    return false;
  }

  return patterns.every((pattern) => patternSchema.safeParse(pattern).success);
}

@ValidatorConstraint({ async: false })
export class PatternListValidator implements ValidatorConstraintInterface {
  validate(patterns: Pattern[]) {
    return isPatternList(patterns);
  }
}

export function IsPatternList(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: PatternListValidator,
    });
  };
}
