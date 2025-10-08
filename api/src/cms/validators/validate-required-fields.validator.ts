/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { BadRequestException } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { FieldType } from '@/setting/schemas/types';

import { ContentField } from '../dto/contentType.dto';

@ValidatorConstraint({ name: 'validateRequiredFields', async: false })
export class ValidateRequiredFields implements ValidatorConstraintInterface {
  private readonly REQUIRED_FIELDS: ContentField[] = [
    {
      name: 'title',
      label: 'Title',
      type: FieldType.text,
    },
    {
      name: 'status',
      label: 'Status',
      type: FieldType.checkbox,
    },
  ];

  validate(fields: ContentField[]): boolean {
    const errors: string[] = [];

    this.REQUIRED_FIELDS.forEach((requiredField, index) => {
      const field = fields[index];

      if (!field) {
        errors.push(`Field ${requiredField.name} is required.`);
        return;
      }

      Object.entries(requiredField).forEach(([key, value]) => {
        if (field[key] !== value) {
          errors.push(
            `fields.${index}.${key} must be ${value}, but got ${field[key]}`,
          );
        }
      });
    });

    if (errors.length > 0) {
      throw new BadRequestException({ message: errors });
    }

    return true;
  }

  defaultMessage(): string {
    return 'The fields must match the required structure.';
  }
}
