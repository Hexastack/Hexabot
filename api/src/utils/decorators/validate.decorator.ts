/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { registerDecorator, ValidationOptions } from 'class-validator';
import { ZodArray, ZodType } from 'zod';

import { buildZodSchemaValidator } from '../helpers/zod-validation';

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
          return buildZodSchemaValidator(schema)(data);
        },
        defaultMessage(validationArguments) {
          const { value, property } = validationArguments || {};
          const { error, success } = schema.safeParse(value);
          if (!success && error?.errors) {
            return error.errors
              .map((e) => `${[property, ...e.path].join('.')}: ${e.message}`)
              .join(', ');
          }

          return `${property}: Validation failed`;
        },
      },
    });
  };
