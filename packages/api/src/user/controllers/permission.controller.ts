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
import { FindManyOptions } from 'typeorm';

import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';

import {
  PermissionCreateDto,
  PermissionDtoConfig,
  PermissionTransformerDto,
} from '../dto/permission.dto';
import { PermissionOrmEntity } from '../entities/permission.entity';
import { ModelService } from '../services/model.service';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';

@Controller('permission')
export class PermissionController extends BaseOrmController<
  PermissionOrmEntity,
  PermissionTransformerDto,
  PermissionDtoConfig
> {
  constructor(
    protected readonly permissionService: PermissionService,
    private readonly roleService: RoleService,
    private readonly modelService: ModelService,
  ) {
    super(permissionService);
  }

  /**
   * Retrieves permissions based on optional filters and populates relationships if requested.
   *
   * @param populate - List of related entities to populate ('model', 'role').
   * @param options - TypeORM query options to apply when fetching permissions.
   *
   * @returns A list of permissions, potentially populated with related entities.
   */
  @Get()
  async find(
    @Query(PopulatePipe)
    populate: string[],
    @Query(
      new TypeOrmSearchFilterPipe<PermissionOrmEntity>({
        allowedFields: ['model.id', 'role.id', 'relation'],
      }),
    )
    options?: FindManyOptions<PermissionOrmEntity>,
  ) {
    const shouldPopulate = populate.length > 0 && this.canPopulate(populate);
    return shouldPopulate
      ? await this.permissionService.findAndPopulate(options)
      : await this.permissionService.find(options);
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
}
