/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Inject, NotFoundException } from '@nestjs/common';
import { FindManyOptions } from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';
import { LoggerService } from '@/logger/logger.service';

import { EntityDto } from '../types/dto.types';

import { BaseOrmRepository } from './base-orm.repository';
import { BaseOrmService } from './base-orm.service';

export abstract class BaseOrmController<
  Entity extends BaseOrmEntity<EntityDto<Entity>>,
> {
  eventEmitter: typeof this.service.eventEmitter;

  @Inject(LoggerService)
  readonly logger: LoggerService;

  protected constructor(protected readonly service: BaseOrmService<Entity>) {
    this.eventEmitter = service.eventEmitter;
  }

  protected getEntityName(repository: BaseOrmRepository<Entity>) {
    return repository['repository']['target']['name'].replace(/OrmEntity$/, '');
  }

  async count(options?: FindManyOptions<Entity>): Promise<{ count: number }> {
    return { count: await this.service.count(options) };
  }

  async findRecords(
    options: FindManyOptions<Entity> = {},
    populate: string[] = [],
  ) {
    return this.service.canPopulate(populate)
      ? await this.service.findAndPopulate(options)
      : await this.service.find(options);
  }

  async findOneRecord(id: string, populate: string[] = []) {
    const record = this.service.canPopulate(populate)
      ? await this.service.findOneAndPopulate(id)
      : await this.service.findOne(id);
    const entityName = this.getEntityName(this.service.getRepository());
    if (!record) {
      this.logger.warn(`Unable to find ${entityName} by id ${id}`);
      throw new NotFoundException(`${entityName} with ID ${id} not found`);
    }

    return record;
  }
}
