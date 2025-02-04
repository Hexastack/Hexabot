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

import {
  BlockMessage,
  blockMessageObjectSchema,
  messageRegexSchema,
  textSchema,
} from '../schemas/types/message';

/* eslint-disable no-console */
export function isValidMessage(msg: any) {
  if (typeof msg === 'string' && msg !== '') {
    const result = messageRegexSchema.safeParse(msg);
    if (!result.success) {
      console.error('Block Model: Invalid custom code.', result.error);
      return false;
    }
    return true;
  } else if (Array.isArray(msg)) {
    const result = textSchema.safeParse(msg);
    if (!result.success) {
      console.error('Block Model: Invalid text message array.', result.error);
    }
    return result.success;
  } else if (typeof msg === 'object' && msg !== null) {
    const result = blockMessageObjectSchema.safeParse(msg);
    if (!result.success) {
      console.error('Block Model: Object validation failed!', result.error);
    }
    return result.success;
  }
  console.log('Validation reached default false');
  return false;
}
/* eslint-enable no-console */

@ValidatorConstraint({ async: false })
export class MessageValidator implements ValidatorConstraintInterface {
  validate(msg: BlockMessage) {
    return isValidMessage(msg);
  }
}

export function IsMessage(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: MessageValidator,
    });
  };
}
