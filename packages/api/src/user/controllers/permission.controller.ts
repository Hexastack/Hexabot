/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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

import { LoggerService } from '@/logger/logger.service';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';
import { TFilterQuery } from '@/utils/types/filter.types';

import { Permission, PermissionCreateDto } from '../dto/permission.dto';
import { ModelService } from '../services/model.service';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';

@Controller('permission')
export class PermissionController {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly roleService: RoleService,
    private readonly modelService: ModelService,
    private readonly logger: LoggerService,
  ) {}

  private canPopulate(populate: string[]): boolean {
    return this.permissionService.canPopulate(populate);
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
    const normalizedFilters = this.normalizeFilters(filters);
    const shouldPopulate = populate.length > 0 && this.canPopulate(populate);
    return shouldPopulate
      ? await this.permissionService.findAndPopulate(normalizedFilters)
      : await this.permissionService.find(normalizedFilters);
  }

  /**
   * Creates a new permission entity.
   *
   * Validates the input data and ensures the role and model exist before creation.
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

  private normalizeFilters(
    filters: TFilterQuery<Permission>,
  ): TFilterQuery<Permission> {
    if (!filters || typeof filters !== 'object') {
      return filters;
    }

    const normalized: Record<string, unknown> = { ...filters };
    if ('model' in normalized) {
      normalized.modelId = normalized.model;
      delete normalized.model;
    }
    if ('role' in normalized) {
      normalized.roleId = normalized.role;
      delete normalized.role;
    }
    return normalized as TFilterQuery<Permission>;
  }
}
