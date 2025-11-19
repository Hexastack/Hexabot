/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { ContentField } from '../dto/contentType.dto';
import { validateUniqueFields } from '../utilities/field-validation.utils';

@ValidatorConstraint({ async: false })
export class UniqueFieldNamesConstraint
  implements ValidatorConstraintInterface
{
  validate(fields: ContentField[], _args: ValidationArguments) {
    return validateUniqueFields(fields, 'label');
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} contains duplicate "label" values; each field.name must be unique`;
  }
}
