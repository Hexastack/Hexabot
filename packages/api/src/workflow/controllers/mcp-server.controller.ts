/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
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
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { FindManyOptions } from 'typeorm';

import { PopulatePipe } from '@/utils';
import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { DeleteResult } from '@/utils/generics/base-orm.repository';
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';

import {
  McpServer,
  McpServerCreateDto,
  McpServerDtoConfig,
  McpServerFull,
  McpServerUpdateDto,
} from '../dto/mcp-server.dto';
import { McpServerOrmEntity } from '../entities/mcp-server.entity';
import {
  McpServerDiagnostics,
  McpToolsDiscovery,
} from '../services/mcp-client-pool.service';
import { McpServerService } from '../services/mcp-server.service';

@Controller('mcpserver')
export class McpServerController extends BaseOrmController<
  McpServerOrmEntity,
  McpServerDtoConfig
> {
  /**
   * Creates the MCP server controller.
   *
   * @param mcpServerService - MCP server service instance.
   * @returns New controller instance.
   */
  constructor(private readonly mcpServerService: McpServerService) {
    super(mcpServerService);
  }

  /**
   * Creates a new MCP server record.
   *
   * @param payload - MCP server creation payload.
   * @returns The created MCP server.
   */
  @Post()
  async create(@Body() payload: McpServerCreateDto): Promise<McpServer> {
    return await this.mcpServerService.create(payload);
  }

  /**
   * Retrieves MCP server records matching filters and optional population.
   *
   * @param populate - Relations requested by the caller.
   * @param options - TypeORM query options.
   * @returns Matching MCP servers.
   */
  @Get()
  async find(
    @Query(PopulatePipe)
    populate: string[] = [],
    @Query(
      new TypeOrmSearchFilterPipe<McpServerOrmEntity>({
        allowedFields: ['name', 'enabled', 'transport', 'url'],
        defaultSort: ['createdAt', 'desc'],
      }),
    )
    options: FindManyOptions<McpServerOrmEntity> = {},
  ): Promise<McpServer[] | McpServerFull[]> {
    const shouldPopulate = this.canPopulate(populate);

    return shouldPopulate
      ? await this.mcpServerService.findAndPopulate(options)
      : await this.mcpServerService.find(options);
  }

  /**
   * Counts MCP server records matching filters.
   *
   * @param options - TypeORM query options.
   * @returns Object containing the count.
   */
  @Get('count')
  async filterCount(
    @Query(
      new TypeOrmSearchFilterPipe<McpServerOrmEntity>({
        allowedFields: ['name', 'enabled', 'transport', 'url', 'credential.id'],
      }),
    )
    options?: FindManyOptions<McpServerOrmEntity>,
  ) {
    return await this.count(options ?? {});
  }

  /**
   * Retrieves one MCP server by identifier.
   *
   * @param id - MCP server identifier.
   * @param populate - Relations requested by the caller.
   * @returns The matching MCP server.
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query(PopulatePipe)
    populate: string[] = [],
  ): Promise<McpServer | McpServerFull> {
    const shouldPopulate = this.canPopulate(populate);
    const record = shouldPopulate
      ? await this.mcpServerService.findOneAndPopulate(id)
      : await this.mcpServerService.findOne(id);
    if (!record) {
      this.logger.warn(`Unable to find MCP server by id ${id}`);
      throw new NotFoundException(`MCP server with ID ${id} not found`);
    }

    return record;
  }

  /**
   * Updates an MCP server by identifier.
   *
   * @param id - MCP server identifier.
   * @param payload - MCP server update payload.
   * @returns The updated MCP server.
   */
  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() payload: McpServerUpdateDto,
  ): Promise<McpServer> {
    await this.ensureServerExists(id, 'update');

    return await this.mcpServerService.updateOne(id, payload);
  }

  /**
   * Deletes an MCP server by identifier.
   *
   * @param id - MCP server identifier.
   * @returns Delete operation result.
   */
  @Delete(':id')
  @HttpCode(204)
  async deleteOne(@Param('id') id: string): Promise<DeleteResult> {
    const result = await this.mcpServerService.deleteOne(id);
    if (result.deletedCount === 0) {
      this.logger.warn(`Unable to delete MCP server by id ${id}`);
      throw new NotFoundException(`MCP server with ID ${id} not found`);
    }

    return result;
  }

  /**
   * Runs connectivity and discovery diagnostics for an MCP server.
   *
   * @param id - MCP server identifier.
   * @returns Diagnostics status payload.
   */
  @Post(':id/test')
  async test(@Param('id') id: string): Promise<McpServerDiagnostics> {
    await this.ensureServerExists(id, 'test');

    return await this.mcpServerService.testConnection(id);
  }

  /**
   * Retrieves normalized tool metadata for an MCP server.
   *
   * @param id - MCP server identifier.
   * @returns Tool discovery payload.
   */
  @Get(':id/tools')
  async tools(@Param('id') id: string): Promise<McpToolsDiscovery> {
    await this.ensureServerExists(id, 'discover');

    return await this.mcpServerService.discoverTools(id);
  }

  /**
   * Ensures that an MCP server exists before executing an operation.
   *
   * @param id - MCP server identifier.
   * @param action - Action label used for logging.
   * @returns No return value.
   */
  private async ensureServerExists(id: string, action: string): Promise<void> {
    const record = await this.mcpServerService.findOne(id);
    if (!record) {
      this.logger.warn(`Unable to ${action} MCP server by id ${id}`);
      throw new NotFoundException(`MCP server with ID ${id} not found`);
    }
  }
}
