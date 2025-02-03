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

import { Position, positionSchema } from '../schemas/types/position';

export function isPosition(position: Position) {
  return positionSchema.safeParse(position).success;
}

@ValidatorConstraint({ async: false })
export class PositionValidator implements ValidatorConstraintInterface {
  validate(position: Position) {
    return isPosition(position);
  }
}

export function IsPosition(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: PositionValidator,
    });
  };
}
