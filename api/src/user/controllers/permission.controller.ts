/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { BaseController } from '@/utils/generics/base-controller';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';
import { TFilterQuery } from '@/utils/types/filter.types';

import { PermissionCreateDto } from '../dto/permission.dto';
import {
  Permission,
  PermissionFull,
  PermissionPopulate,
  PermissionStub,
} from '../schemas/permission.schema';
import { ModelService } from '../services/model.service';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';

@Controller('permission')
export class PermissionController extends BaseController<
  Permission,
  PermissionStub,
  PermissionPopulate,
  PermissionFull
> {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly roleService: RoleService,
    private readonly modelService: ModelService,
  ) {
    super(permissionService);
  }

  /**
   * Retrieves permissions based on optional filters and populates relationships if requested.
   *
   * @param populate - List of related entities to populate ('model', 'role').
   * @param filters - Filter conditions to apply when fetching permissions.
   *
   * @returns A list of permissions, potentially populated with related entities.
   */
  @Get()
  async find(
    @Query(PopulatePipe)
    populate: string[],
    @Query(
      new SearchFilterPipe<Permission>({
        allowedFields: ['model', 'role'],
      }),
    )
    filters: TFilterQuery<Permission>,
  ) {
    return this.canPopulate(populate)
      ? await this.permissionService.findAndPopulate(filters)
      : await this.permissionService.find(filters);
  }

  /**
   * Creates a new permission entity.
   *
   * Validates the input data and ensures the role and model exist before creation.
   * CSRF protection is applied to prevent unauthorized requests.
   *
   * @param permission - The data transfer object (DTO) containing the details for the new permission.
   *
   * @returns The created permission.
   */

  @Post()
  async create(@Body() permission: PermissionCreateDto) {
    const role = await this.roleService.findOne(permission.role);
    if (!role) {
      throw new NotFoundException('Unable to find role');
    }
    const model = await this.modelService.findOne(permission.model);

    if (!model) {
      throw new NotFoundException('Unable to find model');
    }

    return await this.permissionService.create(permission);
  }

  /**
   * Deletes a permission entity by its ID.
   *
   * Attempts to delete the permission and logs a warning if the permission is not found.
   * CSRF protection is applied, and a 204 HTTP response is returned upon successful deletion.
   *
   * @param id - The ID of the permission to delete.
   *
   * @returns The result of the deletion operation.
   */

  @Delete(':id')
  @HttpCode(204)
  async deleteOne(@Param('id') id: string) {
    const result = await this.permissionService.deleteOne(id);
    if (result.deletedCount === 0) {
      this.logger.warn(`Unable to delete Permission by id ${id}`);
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
    return result;
  }
}
