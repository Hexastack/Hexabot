/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Controller, Get, Query } from '@nestjs/common';

import { BaseController } from '@/utils/generics/base-controller';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { TFilterQuery } from '@/utils/types/filter.types';

import {
  Model,
  ModelFull,
  ModelPopulate,
  ModelStub,
} from '../schemas/model.schema';
import { ModelService } from '../services/model.service';

@Controller('model')
export class ModelController extends BaseController<
  Model,
  ModelStub,
  ModelPopulate,
  ModelFull
> {
  constructor(private readonly modelService: ModelService) {
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
    filters: TFilterQuery<Model>,
  ) {
    return this.canPopulate(populate)
      ? await this.modelService.findAndPopulate(filters)
      : await this.modelService.find(filters);
  }
}
