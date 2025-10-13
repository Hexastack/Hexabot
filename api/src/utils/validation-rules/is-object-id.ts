/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { registerDecorator, ValidationOptions } from 'class-validator';
import { Types } from 'mongoose';

export const IsObjectId =
  (validationOptions?: ValidationOptions) =>
  (object: object, propertyName: string) =>
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return Types.ObjectId.isValid(value) ? value : '';
        },
      },
    });
