/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { registerDecorator, ValidationOptions } from 'class-validator';
import { ZodArray, ZodType } from 'zod';

export const Validate =
  (schema: ZodType | ZodArray<any>, validationOptions?: ValidationOptions) =>
  (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(data, _validationArguments) {
          const result = schema.safeParse(data);

          return result.success;
        },
        defaultMessage(validationArguments) {
          const { value, property } = validationArguments || {};
          const { error, success } = schema.safeParse(value);
          if (!success && error) {
            return error.issues
              .map((e) => `${[property, ...e.path].join('.')}: ${e.message}`)
              .join(', ');
          }

          return `${property}: Validation failed`;
        },
      },
    });
  };
