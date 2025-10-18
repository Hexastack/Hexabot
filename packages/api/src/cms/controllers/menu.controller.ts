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
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { LoggerService } from '@/logger/logger.service';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { PageQueryPipe } from '@/utils/pagination/pagination-query.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';
import { TFilterQuery } from '@/utils/types/filter.types';

import {
  Menu,
  MenuCreateDto,
  MenuQueryDto,
  MenuUpdateDto,
} from '../dto/menu.dto';
import { MenuOrmEntity } from '../entities/menu.entity';
import { MenuService } from '../services/menu.service';

@Controller('menu')
export class MenuController {
  constructor(
    private readonly menuService: MenuService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Counts the filtered number of menu items.
   *
   * Applies filtering based on the allowed fields and returns the number of matching menus.
   *
   * @returns A promise that resolves to the count of filtered menu items.
   */
  @Get('count')
  async filterCount(
    @Query(new SearchFilterPipe<MenuOrmEntity>({ allowedFields: ['parent'] }))
    filters: TFilterQuery<MenuOrmEntity>,
  ) {
    return { count: await this.menuService.count(filters) };
  }

  /**
   * Retrieves menu items.
   *
   * If pagination parameters are provided, returns a paginated list.
   * Otherwise, applies filters when present or returns the whole collection.
   */
  @Get()
  async find(
    @Query(PageQueryPipe) pageQuery: PageQueryDto<MenuOrmEntity>,
    @Query(new SearchFilterPipe<MenuOrmEntity>({ allowedFields: ['parent'] }))
    filters: TFilterQuery<MenuOrmEntity>,
    @Query() rawQuery?: MenuQueryDto,
  ) {
    const hasPagination = typeof pageQuery.limit !== 'undefined';
    const hasFilters = filters && Object.keys(filters).length > 0;

    if (hasPagination || hasFilters) {
      return await this.menuService.find(filters ?? {}, pageQuery);
    }

    if (rawQuery && Object.keys(rawQuery).length > 0) {
      return await this.menuService.find(
        rawQuery as TFilterQuery<MenuOrmEntity>,
      );
    }

    return await this.menuService.findAll();
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
  async create(@Body() body: MenuCreateDto): Promise<Menu> {
    return await this.menuService.create(body);
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
  async findOne(@Param('id') id: string): Promise<Menu> {
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
    @Body() body: MenuUpdateDto,
    @Param('id') id: string,
  ): Promise<Menu> {
    if (!id) {
      return await this.create(body as MenuCreateDto);
    }
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
      if (deletedCount === 0) {
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
