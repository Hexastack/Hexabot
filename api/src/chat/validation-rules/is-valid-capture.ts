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
import Joi from 'joi';

type Tentity = -1 | -2;

export interface CaptureVar {
  // entity=`-1` to match text message
  // entity=`-2` for postback payload
  // entity is `String` for NLP entities
  entity: Tentity | string;
  context_var: string;
}

const allowedEntityValues: Tentity[] = [-1, -2];

export function isValidVarCapture(vars: CaptureVar[]) {
  const captureSchema = Joi.array().items(
    Joi.object().keys({
      entity: Joi.alternatives().try(
        // `-1` to match text message & `-2` for postback payload
        Joi.number()
          .valid(...allowedEntityValues)
          .required(),
        // String for NLP entities
        Joi.string().required(),
      ),
      context_var: Joi.string()
        .regex(/^[a-z][a-z_0-9]*$/)
        .required(),
    }),
  );

  const captureCheck = captureSchema.validate(vars);
  if (captureCheck.error) {
    // eslint-disable-next-line
    console.log('Capture vars validation failed!', captureCheck.error);
  }
  return !captureCheck.error;
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
