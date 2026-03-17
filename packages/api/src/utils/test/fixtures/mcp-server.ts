/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource } from 'typeorm';

import { McpServerCreateDto } from '@/workflow/dto/mcp-server.dto';
import { McpServerOrmEntity } from '@/workflow/entities/mcp-server.entity';
import { McpServerTransport } from '@/workflow/types';

type McpServerOrmFixture = {
  id: string;
  name: string;
  enabled: boolean;
  transport: McpServerTransport;
  url: string;
  credential?: null;
};

export const mcpServerFixtureIds = {
  enabled: '11111111-1111-4111-8111-111111111111',
  disabled: '22222222-2222-4222-8222-222222222222',
} as const;

export const mcpServerOrmFixtures: McpServerOrmFixture[] = [
  {
    id: mcpServerFixtureIds.enabled,
    name: 'Primary MCP Server',
    enabled: true,
    transport: McpServerTransport.http,
    url: 'https://mcp.example.com/main',
    credential: null,
  },
  {
    id: mcpServerFixtureIds.disabled,
    name: 'Diagnostics MCP Server',
    enabled: false,
    transport: McpServerTransport.http,
    url: 'https://mcp.example.com/disabled',
    credential: null,
  },
];

export const mcpServerFixtures: McpServerCreateDto[] = mcpServerOrmFixtures.map(
  ({ id: _id, ...fixture }) => fixture,
);

export const installMcpServerFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  const repository = dataSource.getRepository(McpServerOrmEntity);

  if (await repository.count()) {
    return await repository.find();
  }

  const entities = repository.create(mcpServerOrmFixtures);

  return await repository.save(entities);
};
