/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { Types } from 'mongoose';

import { ObjectIdDto } from '../dto/object-id.dto';

@Injectable()
export class ObjectIdPipe implements PipeTransform<string, Promise<string>> {
  async getErrors(value: string) {
    const options = {
      id: Types.ObjectId.isValid(String(value)) ? String(value) : '',
    };
    const dtoObject = plainToClass(ObjectIdDto, options);
    const [errors] = await validate(dtoObject);

    return errors;
  }

  async transform(value: string, { type, data }: ArgumentMetadata) {
    if (typeof value === 'string' && data === 'id' && type === 'param') {
      const errors = await this.getErrors(value);
      if (errors) {
        throw new BadRequestException(
          errors?.constraints
            ? Object.values(errors.constraints)[0]
            : errors.toString(),
        );
      }
    } else if (
      typeof value === 'object' &&
      Object.keys(value).length > 1 &&
      type === 'param'
    ) {
      await Promise.all(
        Object.entries(value).map(async ([param, paramValue]) => {
          if (param.startsWith('id')) {
            const errors = await this.getErrors(String(paramValue));

            if (errors) {
              throw new BadRequestException(
                errors?.constraints
                  ? Object.values(errors.constraints)[0]
                  : errors.toString(),
              );
            }
          }
        }),
      );
    }
    return value;
  }
}
