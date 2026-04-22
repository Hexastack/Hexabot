/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { User } from '@hexabot-ai/types';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { FindManyOptions } from 'typeorm';

import { UuidParam } from '@/utils';
import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';

import { RoleCreateDto, RoleUpdateDto } from '../dto/role.dto';
import { RoleOrmEntity } from '../entities/role.entity';
import { RoleService } from '../services/role.service';
import { UserService } from '../services/user.service';

@Controller('role')
export class RoleController extends BaseOrmController<RoleOrmEntity> {
  constructor(
    protected readonly roleService: RoleService,
    private readonly userService: UserService,
  ) {
    super(roleService);
  }

  /**
   * Retrieves a paginated list of roles with optional filtering and population of related entities.
   *
   * @returns A promise that resolves to the paginated result of roles.
   */
  @Get()
  async findRoles(
    @Query(PopulatePipe)
    populate: string[],
    @Query(
      new TypeOrmSearchFilterPipe<RoleOrmEntity>({
        allowedFields: ['name'],
      }),
    )
    options: FindManyOptions<RoleOrmEntity> = {},
  ) {
    return await this.find(options, populate);
  }

  /**
   * Counts the number of roles that match the provided filters.
   *
   * @returns A promise that resolves to the count of filtered roles.
   */
  @Get('count')
  async filterCount(
    @Query(
      new TypeOrmSearchFilterPipe<RoleOrmEntity>({
        allowedFields: ['name'],
      }),
    )
    options: FindManyOptions<RoleOrmEntity> = {},
  ) {
    return this.count(options);
  }

  /**
   * Retrieves a specific role by its ID. Optionally populates related entities such as permissions and users.
   *
   * @param id The ID of the role to retrieve.
   *
   * @returns A promise that resolves to the role object.
   */
  @Get(':id')
  async findRole(
    @UuidParam('id') id: string,
    @Query(PopulatePipe)
    populate: string[],
  ) {
    return await this.findOne(id, populate);
  }

  /**
   * Creates a new role in the system.
   *
   * @param role The role data for creating a new role.
   *
   * @returns A promise that resolves to the newly created role.
   */
  @Post()
  async create(@Body() role: RoleCreateDto) {
    return await this.roleService.create(role);
  }

  /**
   * Updates an existing role by its ID.
   *
   * @param id The ID of the role to update.
   * @param roleUpdate The updated data for the role.
   *
   * @returns A promise that resolves to the updated role.
   */
  @Patch(':id')
  async updateOne(
    @UuidParam('id') id: string,
    @Body() roleUpdate: RoleUpdateDto,
  ) {
    return await this.roleService.updateOne(id, roleUpdate);
  }

  /**
   * Deletes a role by its ID.
   *
   * @param id The ID of the role to delete.
   *
   * @returns A promise that resolves to the result of the deletion.
   */
  @Delete(':id')
  @HttpCode(204)
  async deleteRole(@UuidParam('id') id: string, @Req() req: Request) {
    const requester = req.user as User | undefined;
    const requesterRoleIds = Array.isArray(requester?.roles)
      ? requester.roles
      : [];

    if (requesterRoleIds.includes(id)) {
      throw new ForbiddenException("Your account's role can't be deleted");
    }

    const associatedUser = await this.userService.findOneAndPopulate({
      where: {
        roles: {
          id,
        },
      },
    });

    if (associatedUser) {
      throw new ForbiddenException('Role is associated with other users');
    }

    const result = await this.roleService.deleteOne(id);
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return result;
  }
}
