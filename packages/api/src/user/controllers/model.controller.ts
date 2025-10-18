/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Controller, Get, Query } from '@nestjs/common';

import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { TFilterQuery } from '@/utils/types/filter.types';

import { ModelDtoConfig, ModelTransformerDto } from '../dto/model.dto';
import { ModelOrmEntity } from '../entities/model.entity';
import { ModelService } from '../services/model.service';

@Controller('model')
export class ModelController extends BaseOrmController<
  ModelOrmEntity,
  ModelTransformerDto,
  ModelDtoConfig
> {
  constructor(
    protected readonly modelService: ModelService,
  ) {
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
    filters: TFilterQuery<ModelOrmEntity>,
  ) {
    return this.canPopulate(populate)
      ? await this.modelService.findAndPopulate(filters)
      : await this.modelService.find(filters);
  }
}
