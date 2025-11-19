/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Inject } from '@nestjs/common';
import { FindManyOptions } from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';
import { LoggerService } from '@/logger/logger.service';

import { DtoActionConfig, DtoTransformerConfig } from '../types/dto.types';

import { BaseOrmService } from './base-orm.service';

export abstract class BaseOrmController<
  Entity extends BaseOrmEntity,
  TransformerDto extends DtoTransformerConfig,
  ActionDto extends DtoActionConfig,
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

  async count(options?: FindManyOptions<Entity>): Promise<{ count: number }> {
    return { count: await this.service.count(options) };
  }
}
