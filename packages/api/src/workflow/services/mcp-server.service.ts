/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmService } from '@/utils/generics/base-orm.service';

import { McpServerDtoConfig } from '../dto/mcp-server.dto';
import { McpServerOrmEntity } from '../entities/mcp-server.entity';
import { McpServerRepository } from '../repositories/mcp-server.repository';

import {
  McpClientPoolService,
  McpServerDiagnostics,
  McpToolSummary,
} from './mcp-client-pool.service';

@Injectable()
export class McpServerService extends BaseOrmService<
  McpServerOrmEntity,
  McpServerDtoConfig
> {
  /**
   * Creates the MCP server service.
   *
   * @param repository - MCP server repository instance.
   * @param mcpClientPoolService - MCP client pool service instance.
   * @returns New service instance.
   */
  constructor(
    readonly repository: McpServerRepository,
    private readonly mcpClientPoolService: McpClientPoolService,
  ) {
    super(repository);
  }

  /**
   * Tests MCP server connectivity and returns diagnostics.
   *
   * @param id - MCP server identifier.
   * @returns MCP diagnostics payload.
   */
  async testConnection(id: string): Promise<McpServerDiagnostics> {
    return await this.mcpClientPoolService.testServer(id);
  }

  /**
   * Discovers tools exposed by an MCP server.
   *
   * @param id - MCP server identifier.
   * @returns MCP server tools list.
   */
  async discoverTools(id: string): Promise<McpToolSummary[]> {
    const discovery =
      await this.mcpClientPoolService.listToolsForDiagnostics(id);

    return discovery.tools;
  }
}
