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

import { LoggerService } from '@/logger/logger.service';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { PageQueryPipe } from '@/utils/pagination/pagination-query.pipe';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';
import { TFilterQuery } from '@/utils/types/filter.types';

import { RoleCreateDto, RoleUpdateDto } from '../dto/role.dto';
import { User } from '../dto/user.dto';
import { RoleOrmEntity } from '../entities/role.entity';
import { RoleService } from '../services/role.service';
import { UserService } from '../services/user.service';

@Controller('role')
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly userService: UserService,
    private readonly logger: LoggerService,
  ) {}

  private canPopulate(populate: string[]): boolean {
    return this.roleService.canPopulate(populate);
  }

  /**
   * Retrieves a paginated list of roles with optional filtering and population of related entities.
   *
   * @returns A promise that resolves to the paginated result of roles.
   */
  @Get()
  async findPage(
    @Query(PageQueryPipe) pageQuery: PageQueryDto<RoleOrmEntity>,
    @Query(PopulatePipe)
    populate: string[],
    @Query(new SearchFilterPipe<RoleOrmEntity>({ allowedFields: ['name'] }))
    filters: TFilterQuery<RoleOrmEntity>,
  ) {
    const shouldPopulate = populate.length > 0 && this.canPopulate(populate);
    return shouldPopulate
      ? await this.roleService.findAndPopulate(filters, pageQuery)
      : await this.roleService.find(filters, pageQuery);
  }

  /**
   * Counts the number of roles that match the provided filters.
   *
   * @returns A promise that resolves to the count of filtered roles.
   */
  @Get('count')
  async filterCount(
    @Query(new SearchFilterPipe<RoleOrmEntity>({ allowedFields: ['name'] }))
    filters?: TFilterQuery<RoleOrmEntity>,
  ) {
    return { count: await this.roleService.count(filters) };
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
    const doc = shouldPopulate
      ? await this.roleService.findOneAndPopulate(id)
      : await this.roleService.findOne(id);

    if (!doc) {
      this.logger.warn(`Unable to find Role by id ${id}`);
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return doc;
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
