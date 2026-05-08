/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { NotFoundException } from '@nestjs/common';

import { McpServerTransport } from '@/workflow/types';

import { HexabotMcpServerTools } from './mcp-server-mcp.tools';

const buildMcpServerTools = (overrides: Record<string, unknown> = {}) => {
  const mcpServerService = overrides.mcpServerService ?? ({} as any);

  return new HexabotMcpServerTools(mcpServerService as any);
};

describe('HexabotMcpServerTools', () => {
  it('searches MCP servers with pagination and filters', async () => {
    const server = {
      id: 'mcp-server-id',
      name: 'Primary MCP Server',
      transport: McpServerTransport.http,
    };
    const mcpServerService = {
      findAndPopulate: jest.fn().mockResolvedValue([server]),
      count: jest.fn().mockResolvedValue(1),
    };
    const tools = buildMcpServerTools({ mcpServerService });
    const credentialId = '11111111-1111-4111-8111-111111111111';

    await expect(
      tools.searchMcpServers({
        query: 'primary',
        enabled: true,
        transport: McpServerTransport.http,
        credentialId,
        limit: 10,
        skip: 5,
        sortBy: 'name',
        sortDirection: 'ASC',
      }),
    ).resolves.toEqual({
      items: [server],
      total: 1,
      limit: 10,
      skip: 5,
    });

    const options = mcpServerService.findAndPopulate.mock.calls[0][0];
    expect(options).toMatchObject({
      take: 10,
      skip: 5,
      order: { name: 'ASC' },
    });
    expect(options.where).toHaveLength(3);
    expect(
      options.where.map((clause: Record<string, unknown>) =>
        Object.keys(clause),
      ),
    ).toEqual([
      ['enabled', 'transport', 'credential', 'name'],
      ['enabled', 'transport', 'credential', 'url'],
      ['enabled', 'transport', 'credential', 'command'],
    ]);
    expect(options.where).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          enabled: true,
          transport: McpServerTransport.http,
          credential: { id: credentialId },
        }),
      ]),
    );
    expect(mcpServerService.count).toHaveBeenCalledWith({
      where: options.where,
    });
  });

  it('returns one MCP server when it exists', async () => {
    const server = {
      id: 'mcp-server-id',
      name: 'Primary MCP Server',
    };
    const mcpServerService = {
      findOneAndPopulate: jest.fn().mockResolvedValue(server),
    };
    const tools = buildMcpServerTools({ mcpServerService });

    await expect(
      tools.getMcpServer({ id: '11111111-1111-4111-8111-111111111111' }),
    ).resolves.toEqual(server);
    expect(mcpServerService.findOneAndPopulate).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
    );
  });

  it('throws NotFoundException when an MCP server is missing', async () => {
    const mcpServerService = {
      findOneAndPopulate: jest.fn().mockResolvedValue(null),
    };
    const tools = buildMcpServerTools({ mcpServerService });

    await expect(
      tools.getMcpServer({ id: '11111111-1111-4111-8111-111111111111' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates an MCP server with default transport and enabled state', async () => {
    const created = {
      id: 'mcp-server-id',
      name: 'Primary MCP Server',
      enabled: true,
      transport: McpServerTransport.http,
      url: 'https://mcp.example.com/main',
    };
    const mcpServerService = {
      create: jest.fn().mockResolvedValue(created),
    };
    const tools = buildMcpServerTools({ mcpServerService });

    await expect(
      tools.createMcpServer({
        name: 'Primary MCP Server',
        url: 'https://mcp.example.com/main',
      }),
    ).resolves.toEqual(created);

    expect(mcpServerService.create).toHaveBeenCalledWith({
      name: 'Primary MCP Server',
      enabled: true,
      transport: McpServerTransport.http,
      url: 'https://mcp.example.com/main',
    });
  });

  it('updates an existing MCP server with mutable fields only', async () => {
    const existing = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Primary MCP Server',
    };
    const updated = {
      ...existing,
      enabled: false,
    };
    const mcpServerService = {
      findOneAndPopulate: jest.fn().mockResolvedValue(existing),
      updateOne: jest.fn().mockResolvedValue(updated),
    };
    const tools = buildMcpServerTools({ mcpServerService });

    await expect(
      tools.updateMcpServer({
        id: existing.id,
        enabled: false,
      }),
    ).resolves.toEqual(updated);

    expect(mcpServerService.findOneAndPopulate).toHaveBeenCalledWith(
      existing.id,
    );
    expect(mcpServerService.updateOne).toHaveBeenCalledWith(existing.id, {
      enabled: false,
    });
  });
});
