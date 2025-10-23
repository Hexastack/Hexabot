/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Inject, NotFoundException } from '@nestjs/common';
import { FindManyOptions } from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';
import { LoggerService } from '@/logger/logger.service';

import { DtoActionConfig, DtoTransformerConfig } from '../types/dto.types';
import { TValidateProps } from '../types/filter.types';

import { BaseOrmService } from './base-orm.service';

export abstract class BaseOrmController<
  Entity extends BaseOrmEntity,
  TransformerDto extends DtoTransformerConfig,
  ActionDto extends DtoActionConfig,
  TStub = never,
> {
  eventEmitter: typeof this.service.eventEmitter;

  @Inject(LoggerService)
  readonly logger: LoggerService;

  protected constructor(
    protected readonly service: BaseOrmService<
      Entity,
      TransformerDto,
      ActionDto
    >,
  ) {
    this.eventEmitter = service.eventEmitter;
  }

  protected canPopulate(populate: string[]): boolean {
    return this.service.canPopulate(populate);
  }

  protected validate({ dto, allowedIds }: TValidateProps<Entity, TStub>): void {
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

  async count(options?: FindManyOptions<Entity>): Promise<{ count: number }> {
    return { count: await this.service.count(options) };
  }
}
