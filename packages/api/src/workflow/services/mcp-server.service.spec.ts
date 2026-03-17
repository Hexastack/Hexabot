/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { McpServerService } from './mcp-server.service';

describe('McpServerService', () => {
  let service: McpServerService;
  let repository: {
    create: jest.Mock;
    updateOne: jest.Mock;
  };
  let mcpClientPoolService: {
    testServer: jest.Mock;
    listToolsForDiagnostics: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      updateOne: jest.fn(),
    };
    mcpClientPoolService = {
      testServer: jest.fn(),
      listToolsForDiagnostics: jest.fn(),
    };
    service = new McpServerService(
      repository as any,
      mcpClientPoolService as any,
    );
  });

  it('passes create payload through without service-level normalization', async () => {
    const payload = {
      name: 'Stdio MCP',
      transport: 'stdio',
      url: ' https://kept-by-service.example.com ',
      command: ' npx ',
      credential: '11111111-1111-4111-8111-111111111111',
    };
    repository.create.mockResolvedValue({ id: 'server-1', ...payload });

    await service.create(payload as any);

    expect(repository.create).toHaveBeenCalledWith(payload);
  });

  it('passes update payload through without service-level normalization', async () => {
    const payload = {
      transport: 'http',
      command: 'should-be-cleared-at-entity-level',
    };
    repository.updateOne.mockResolvedValue({ id: 'server-1', ...payload });

    await service.updateOne('server-1', payload as any);

    expect(repository.updateOne).toHaveBeenCalledWith(
      'server-1',
      payload,
      undefined,
    );
  });

  it('delegates connection test to MCP client pool service', async () => {
    const diagnostics = {
      ok: true,
      checkedAt: new Date().toISOString(),
      latencyMs: 1,
      server: {
        id: 'server-1',
        name: 'MCP',
        enabled: true,
        transport: 'http',
        url: 'https://mcp.example.com',
      },
      toolCount: 0,
      sampledToolNames: [],
    };
    mcpClientPoolService.testServer.mockResolvedValue(diagnostics);

    const result = await service.testConnection('server-1');

    expect(mcpClientPoolService.testServer).toHaveBeenCalledWith('server-1');
    expect(result).toEqual(diagnostics);
  });

  it('delegates tools discovery to MCP client pool service', async () => {
    const discovery = {
      server: {
        id: 'server-1',
        name: 'MCP',
        enabled: true,
        transport: 'http',
        url: 'https://mcp.example.com',
      },
      toolCount: 0,
      tools: [
        {
          id: 'server-1:calculator',
          serverId: 'server-1',
          name: 'calculator',
          inputSchema: { type: 'object' },
        },
      ],
    };
    mcpClientPoolService.listToolsForDiagnostics.mockResolvedValue(discovery);

    const result = await service.discoverTools('server-1');

    expect(mcpClientPoolService.listToolsForDiagnostics).toHaveBeenCalledWith(
      'server-1',
    );
    expect(result).toEqual(discovery.tools);
  });
});
