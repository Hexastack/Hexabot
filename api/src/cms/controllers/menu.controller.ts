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
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { BaseController } from '@/utils/generics/base-controller';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { PageQueryPipe } from '@/utils/pagination/pagination-query.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';
import { TFilterQuery } from '@/utils/types/filter.types';

import { MenuCreateDto, MenuQueryDto } from '../dto/menu.dto';
import { Menu, MenuFull, MenuPopulate, MenuStub } from '../schemas/menu.schema';
import { MenuService } from '../services/menu.service';

@Controller('menu')
export class MenuController extends BaseController<
  Menu,
  MenuStub,
  MenuPopulate,
  MenuFull
> {
  constructor(private readonly menuService: MenuService) {
    super(menuService);
  }

  /**
   * Counts the filtered number of menu items.
   *
   * Applies filtering based on the allowed fields and returns the number of matching menus.
   *
   * @returns A promise that resolves to the count of filtered menu items.
   */
  @Get('count')
  async filterCount(
    @Query(new SearchFilterPipe<Menu>({ allowedFields: ['parent'] }))
    filters: TFilterQuery<Menu>,
  ) {
    return await this.count(filters);
  }

  /**
   * Retrieves a paginated list of menu items.
   *
   * Fetches a paginated set of menus based on query parameters and search filters.
   *
   * @returns A promise that resolves to the paginated list of menu items.
   */
  @Get()
  async findPage(
    @Query(PageQueryPipe) pageQuery: PageQueryDto<Menu>,
    @Query(new SearchFilterPipe<Menu>({ allowedFields: ['parent'] }))
    filters: TFilterQuery<Menu>,
  ) {
    return await this.menuService.find(filters, pageQuery);
  }

  /**
   * Creates a new menu item.
   *
   * Validates the menu creation request and inserts a new menu into the database.
   *
   * @param body - DTO containing the data needed to create the new menu.
   *
   * @returns A promise that resolves to the created menu item.
   */
  @Post()
  async create(@Body() body: MenuCreateDto) {
    this.validate({
      dto: body,
      allowedIds: {
        parent: body?.parent
          ? (await this.menuService.findOne(body.parent))?.id
          : undefined,
      },
    });
    return await this.menuService.create(body);
  }

  /**
   * Retrieves all menu items or filters menus based on query parameters.
   *
   * If query parameters are provided, it applies filters and returns matching menus.
   *
   * @param query - Optional DTO for filtering menus.
   *
   * @returns A promise that resolves to an array of menu items.
   */
  @Get()
  async findAll(@Query() query?: MenuQueryDto) {
    if (!query) return await this.menuService.findAll();
    return await this.menuService.find(query);
  }

  /**
   * Retrieves a tree-structured list of menu items.
   *
   * This endpoint returns menus arranged in a hierarchical tree structure.
   *
   * @returns A promise that resolves to the tree-structured list of menu items.
   */
  @Get('tree')
  async getTree() {
    return await this.menuService.getTree();
  }

  /**
   * Retrieves a single menu item by its ID.
   *
   * Fetches a menu item based on its ID and handles not found or error scenarios.
   *
   * @param id - The ID of the menu item to retrieve.
   *
   * @returns A promise that resolves to the menu item if found, or throws a `NotFoundException`.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.menuService.findOne(id);
      if (!result) {
        this.logger.warn(`Unable to find menu with id: ${id}`);
        throw new NotFoundException(`Menu with id: ${id} not found`);
      }
      return result;
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
  }

  /**
   * Updates an existing menu item or creates a new one if the ID does not exist.
   *
   * Checks the validity of the request and updates the menu item with the given ID, or creates a new one if the ID is not provided.
   *
   * @param body - DTO containing the data needed to update the menu.
   * @param id - The ID of the menu to update.
   *
   * @returns A promise that resolves to the updated or newly created menu item.
   */
  @Patch(':id')
  async updateOne(
    @Body() body: MenuCreateDto,
    @Param('id') id: string,
  ): Promise<Menu> {
    if (!id) return await this.create(body);
    return await this.menuService.updateOne(id, body);
  }

  /**
   * Deletes a menu item by its ID.
   *
   * Deletes the specified menu item and its child menus, handling errors and not found scenarios.
   *
   * @param id - The ID of the menu to delete.
   *
   * @returns A promise that resolves to an empty string upon successful deletion.
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    try {
      const deletedCount = await this.menuService.deepDelete(id);
      if (deletedCount == 0) {
        this.logger.warn(`Unable to delete menu with id: ${id}`);
        throw new NotFoundException();
      }
      return '';
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
  }
}
