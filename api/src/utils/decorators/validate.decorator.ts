/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { ZodType } from 'zod';

import { buildZodSchemaValidator } from '../helpers/zod-validation';

export const Validate =
  (schema: ZodType, validationOptions?: ValidationOptions) =>
  (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(data: unknown, _validationArguments?: ValidationArguments) {
          return buildZodSchemaValidator(schema)(data);
        },
        defaultMessage({ value, property }: ValidationArguments) {
          return (
            schema
              ?.safeParse?.(value)
              ?.error?.errors.map((e) => `${property}: ${e.message}`)
              .join(', ') || 'Validation failed'
          );
        },
      },
    });
  };
