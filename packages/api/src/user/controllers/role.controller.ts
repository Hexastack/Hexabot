/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { FindManyOptions } from 'typeorm';

import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';

import {
  RoleCreateDto,
  RoleDtoConfig,
  RoleTransformerDto,
  RoleUpdateDto,
} from '../dto/role.dto';
import { User } from '../dto/user.dto';
import { RoleOrmEntity } from '../entities/role.entity';
import { RoleService } from '../services/role.service';
import { UserService } from '../services/user.service';

@Controller('role')
export class RoleController extends BaseOrmController<
  RoleOrmEntity,
  RoleTransformerDto,
  RoleDtoConfig
> {
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
  async findPage(
    @Query(PopulatePipe)
    populate: string[],
    @Query(
      new TypeOrmSearchFilterPipe<RoleOrmEntity>({
        allowedFields: ['name'],
      }),
    )
    options?: FindManyOptions<RoleOrmEntity>,
  ) {
    const shouldPopulate = populate.length > 0 && this.canPopulate(populate);

    return shouldPopulate
      ? await this.roleService.findAndPopulate(options)
      : await this.roleService.find(options);
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
    options?: FindManyOptions<RoleOrmEntity>,
  ) {
    return super.count(options);
  }

  /**
   * Retrieves a specific role by its ID. Optionally populates related entities such as permissions and users.
   *
   * @param id The ID of the role to retrieve.
   *
   * @returns A promise that resolves to the role object.
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query(PopulatePipe)
    populate: string[],
  ) {
    const shouldPopulate = populate.length > 0 && this.canPopulate(populate);
    const record = shouldPopulate
      ? await this.roleService.findOneAndPopulate(id)
      : await this.roleService.findOne(id);

    if (!record) {
      this.logger.warn(`Unable to find Role by id ${id}`);
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return record;
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
  async updateOne(@Param('id') id: string, @Body() roleUpdate: RoleUpdateDto) {
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
  async deleteOne(@Param('id') id: string, @Req() req: Request) {
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
