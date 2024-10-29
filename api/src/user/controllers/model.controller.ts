/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
