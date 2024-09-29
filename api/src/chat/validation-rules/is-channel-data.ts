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

export function isChannelData(channel: any) {
  return (
    typeof channel === 'object' &&
    channel.name &&
    typeof channel.name === 'string'
  );
}

@ValidatorConstraint({ async: false })
export class ChannelDataValidator implements ValidatorConstraintInterface {
  validate(channel: any) {
    return isChannelData(channel);
  }
}

export function IsChannelData(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: ChannelDataValidator,
    });
  };
}
