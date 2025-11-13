/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmController } from '@hexabot/core/database';
import { PopulatePipe, TypeOrmSearchFilterPipe } from '@hexabot/core/pipes';
import { Controller, Get, Query } from '@nestjs/common';
import { FindManyOptions } from 'typeorm';

import { ModelDtoConfig, ModelTransformerDto } from '../dto/model.dto';
import { ModelOrmEntity } from '../entities/model.entity';
import { ModelService } from '../services/model.service';

@Controller('model')
export class ModelController extends BaseOrmController<
  ModelOrmEntity,
  ModelTransformerDto,
  ModelDtoConfig
> {
  constructor(protected readonly modelService: ModelService) {
    super(modelService);
  }

  /**
   * Handles GET requests to retrieve `Model` entities.
   *
   * Allows querying `Model` entities with optional population of related fields,
   * such as 'permissions', based on the request parameters.
   *
   * @param populate - An array of fields to populate in the returned `Model` entities.
   * @param filters - Filters to apply when querying the `Model` entities.
   *
   * @returns The found `Model` entities, optionally populated with related data.
   */
  @Get()
  async find(
    @Query(PopulatePipe)
    populate: string[],
    @Query(
      new TypeOrmSearchFilterPipe<ModelOrmEntity>({
        allowedFields: ['name', 'identity'],
      }),
    )
    options?: FindManyOptions<ModelOrmEntity>,
  ) {
    return this.canPopulate(populate)
      ? await this.modelService.findAndPopulate(options)
      : await this.modelService.find(options);
  }
}
