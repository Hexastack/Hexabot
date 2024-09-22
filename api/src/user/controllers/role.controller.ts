/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
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
  Patch,
  Query,
  UseInterceptors,
  ForbiddenException,
  Session,
} from '@nestjs/common';
import { CsrfCheck } from '@tekuconcept/nestjs-csrf';
import { Session as ExpressSession } from 'express-session';
import { TFilterQuery } from 'mongoose';

import { CsrfInterceptor } from '@/interceptors/csrf.interceptor';
import { LoggerService } from '@/logger/logger.service';
import { BaseController } from '@/utils/generics/base-controller';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { PageQueryPipe } from '@/utils/pagination/pagination-query.pipe';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';

import { RoleCreateDto, RoleUpdateDto } from '../dto/role.dto';
import { Role, RoleFull, RolePopulate, RoleStub } from '../schemas/role.schema';
import { RoleService } from '../services/role.service';
import { UserService } from '../services/user.service';

@UseInterceptors(CsrfInterceptor)
@Controller('role')
export class RoleController extends BaseController<
  Role,
  RoleStub,
  RolePopulate,
  RoleFull
> {
  constructor(
    private readonly roleService: RoleService,
    private readonly logger: LoggerService,
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
    @Query(PageQueryPipe) pageQuery: PageQueryDto<Role>,
    @Query(PopulatePipe)
    populate: string[],
    @Query(new SearchFilterPipe<Role>({ allowedFields: ['name'] }))
    filters: TFilterQuery<Role>,
  ) {
    return this.canPopulate(populate)
      ? await this.roleService.findPageAndPopulate(filters, pageQuery)
      : await this.roleService.findPage(filters, pageQuery);
  }

  /**
   * Counts the number of roles that match the provided filters.
   *
   * @returns A promise that resolves to the count of filtered roles.
   */
  @Get('count')
  async filterCount(
    @Query(new SearchFilterPipe<Role>({ allowedFields: ['name'] }))
    filters?: TFilterQuery<Role>,
  ) {
    return await this.count(filters);
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
    const doc = this.canPopulate(populate)
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
  @CsrfCheck(true)
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
  @CsrfCheck(true)
  @Patch(':id')
  async updateOne(@Param('id') id: string, @Body() roleUpdate: RoleUpdateDto) {
    const result = await this.roleService.updateOne(id, roleUpdate);
    if (!result) {
      this.logger.warn(`Unable to update Role by id ${id}`);
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return result;
  }

  /**
   * Deletes a role by its ID.
   *
   * @param id The ID of the role to delete.
   *
   * @returns A promise that resolves to the result of the deletion.
   */
  @CsrfCheck(true)
  @Delete(':id')
  @HttpCode(204)
  async deleteOne(@Param('id') id: string, @Session() session: ExpressSession) {
    const currentUser = await this.userService.findOneAndPopulate(
      session.passport.user.id,
      ['roles'],
    );
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const roles = currentUser.roles.map((role) => role.id);

    if (roles.includes(id)) {
      throw new ForbiddenException("Your account's role can't be deleted");
    } else {
      try {
        const result = await this.roleService.deleteOne(id);
        if (result.deletedCount === 0) {
          throw new NotFoundException(`Role with ID ${id} not found`);
        }
        return result;
      } catch (error) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }
    }
  }
}
