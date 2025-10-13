/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Inject, NotFoundException } from '@nestjs/common';

import { LoggerService } from '@/logger/logger.service';
import { TFilterQuery } from '@/utils/types/filter.types';

import { DtoConfig } from '../types/dto.types';
import { TValidateProps } from '../types/filter.types';

import { BaseSchema } from './base-schema';
import { BaseService } from './base-service';

export abstract class BaseController<
  T extends BaseSchema,
  TStub = never,
  P extends string = never,
  TFull extends Omit<T, P> = never,
  Dto extends DtoConfig = object,
> {
  eventEmitter: typeof this.service.eventEmitter;

  @Inject(LoggerService)
  readonly logger: LoggerService;

  constructor(protected readonly service: BaseService<T, P, TFull, Dto>) {
    this.eventEmitter = service.eventEmitter;
  }

  /**
   * Checks if the given populate fields are allowed based on the allowed fields list.
   * @param populate - The list of populate fields.
   * @param  allowedFields - The list of allowed populate fields.
   * @return - True if all populate fields are allowed, otherwise false.
   */
  protected canPopulate(populate: string[]): boolean {
    return this.service.canPopulate(populate);
  }

  /**
   * Validates the provided DTO against allowed IDs.
   * @param {TValidateProps<T, TStub>} - The validation properties
   * @throws {NotFoundException} Throws a NotFoundException if any invalid IDs are found.
   */
  protected validate({ dto, allowedIds }: TValidateProps<T, TStub>): void {
    const exceptions: string[] = [];
    Object.entries(dto)
      .filter(([key]) => Object.keys(allowedIds).includes(key))
      .forEach(([field]) => {
        const invalidIds = (
          Array.isArray(dto[field]) ? dto[field] : [dto[field]]
        ).filter(
          (id) =>
            !(
              Array.isArray(allowedIds[field])
                ? allowedIds[field]
                : [allowedIds[field]]
            ).includes(id),
        );

        if (invalidIds.length) {
          exceptions.push(
            `${field} with ID${
              invalidIds.length > 1 ? 's' : ''
            } '${invalidIds}' not found`,
          );
        }
      });

    if (exceptions.length) throw new NotFoundException(exceptions.join('; '));
  }

  /**
   * Counts filtered items.
   * @return Object containing the count of items.
   */
  async count(filters?: TFilterQuery<T>): Promise<{
    count: number;
  }> {
    return { count: await this.service.count(filters) };
  }
}
