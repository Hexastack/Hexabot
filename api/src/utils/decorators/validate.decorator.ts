/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
