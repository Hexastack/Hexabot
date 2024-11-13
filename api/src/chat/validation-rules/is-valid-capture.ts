/*
 * Copyright © 2024 Hexastack. All rights reserved.
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
import { z } from 'zod';

import { CaptureVar, captureVarSchema } from '../schemas/types/capture-var';

// Define the array schema
const captureVarArraySchema = z.array(captureVarSchema);

// Validation function
export function isValidVarCapture(vars: CaptureVar[]) {
  return captureVarArraySchema.safeParse(vars).success;
}

@ValidatorConstraint({ async: false })
export class CaptureVarValidator implements ValidatorConstraintInterface {
  validate(vars: CaptureVar[]) {
    return isValidVarCapture(vars);
  }
}

export function IsVarCapture(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: CaptureVarValidator,
    });
  };
}
