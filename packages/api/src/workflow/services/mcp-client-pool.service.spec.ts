/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createMCPClient } from '@ai-sdk/mcp';
import { Experimental_StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio';
import { ToolSet } from 'ai';

import { CredentialService } from '@/user/services/credential.service';

import { McpServerRepository } from '../repositories/mcp-server.repository';
import { McpServerTransport } from '../types';

import { McpClientPoolService } from './mcp-client-pool.service';

jest.mock('@ai-sdk/mcp', () => ({
  createMCPClient: jest.fn(),
}));

type MockedMcpClient = {
  listTools: jest.Mock;
  toolsFromDefinitions: jest.Mock;
  close: jest.Mock;
};

const createClient = (toolNames: string[] = ['calculator', 'search']) => {
  const listToolsPayload = {
    tools: toolNames.map((name) => ({
      name,
      title: name,
      description: `${name} tool`,
      inputSchema: {
        type: 'object',
        properties: {},
      },
      _meta: {},
    })),
    _meta: {
      version: '1.0.0',
    },
  };
  const toolsFromDefinitions = jest.fn((definitions) => {
    return Object.fromEntries(
      definitions.tools.map((tool: { name: string }) => [
        tool.name,
        {
          description: `${tool.name} tool`,
          inputSchema: {
            type: 'object',
            properties: {},
          },
          execute: jest.fn(),
        },
      ]),
    ) as ToolSet;
  });

  return {
    listTools: jest.fn().mockResolvedValue(listToolsPayload),
    toolsFromDefinitions,
    close: jest.fn().mockResolvedValue(undefined),
  } satisfies MockedMcpClient;
};
const enabledServer = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Enabled MCP',
  enabled: true,
  transport: McpServerTransport.http,
  url: 'https://mcp.example.com/enabled',
  command: null,
  args: null,
  cwd: null,
  credential: null,
};
const disabledServer = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Disabled MCP',
  enabled: false,
  transport: McpServerTransport.http,
  url: 'https://mcp.example.com/disabled',
  command: null,
  args: null,
  cwd: null,
  credential: null,
};
const stdioServer = {
  id: '33333333-3333-4333-8333-333333333333',
  name: 'Stdio MCP',
  enabled: true,
  transport: McpServerTransport.stdio,
  url: null,
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem'],
  cwd: '/tmp',
  credential: null,
};

describe('McpClientPoolService', () => {
  let service: McpClientPoolService;
  let mcpServerRepository: { findOne: jest.Mock };
  let credentialService: { findOneValue: jest.Mock };
  let logger: { warn: jest.Mock; error: jest.Mock };

  beforeEach(() => {
    mcpServerRepository = {
      findOne: jest.fn(),
    };
    credentialService = {
      findOneValue: jest.fn().mockResolvedValue(''),
    };
    logger = {
      warn: jest.fn(),
      error: jest.fn(),
    };
    service = new McpClientPoolService(
      mcpServerRepository as unknown as McpServerRepository,
      credentialService as unknown as CredentialService,
      logger as any,
    );
    (createMCPClient as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('initializes one client for concurrent calls (single-flight)', async () => {
    mcpServerRepository.findOne.mockResolvedValue(enabledServer);
    const client = createClient();
    (createMCPClient as jest.Mock).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));

      return client;
    });

    const [resolvedA, resolvedB] = await Promise.all([
      service.getOrCreateClient(enabledServer.id),
      service.getOrCreateClient(enabledServer.id),
    ]);

    expect(resolvedA).toBe(client);
    expect(resolvedB).toBe(client);
    expect(createMCPClient).toHaveBeenCalledTimes(1);
  });

  it('reuses pooled client for subsequent calls', async () => {
    mcpServerRepository.findOne.mockResolvedValue(enabledServer);
    const client = createClient();
    (createMCPClient as jest.Mock).mockResolvedValue(client);

    const first = await service.getOrCreateClient(enabledServer.id);
    const second = await service.getOrCreateClient(enabledServer.id);

    expect(first).toBe(client);
    expect(second).toBe(client);
    expect(createMCPClient).toHaveBeenCalledTimes(1);
  });

  it('closes and evicts clients when idle timeout expires', async () => {
    jest.useFakeTimers();
    mcpServerRepository.findOne.mockResolvedValue(enabledServer);
    const firstClient = createClient();
    const secondClient = createClient();
    (createMCPClient as jest.Mock)
      .mockResolvedValueOnce(firstClient)
      .mockResolvedValueOnce(secondClient);

    await service.getOrCreateClient(enabledServer.id);
    jest.advanceTimersByTime(McpClientPoolService.DEFAULT_IDLE_TTL_MS + 10);
    await Promise.resolve();
    await Promise.resolve();

    expect(firstClient.close).toHaveBeenCalledTimes(1);

    const next = await service.getOrCreateClient(enabledServer.id);
    expect(next).toBe(secondClient);
    expect(createMCPClient).toHaveBeenCalledTimes(2);
  });

  it('closes pooled clients on module shutdown', async () => {
    mcpServerRepository.findOne.mockImplementation(async (id: string) => {
      if (id === enabledServer.id) {
        return enabledServer;
      }
      if (id === disabledServer.id) {
        return {
          ...disabledServer,
          enabled: true,
        };
      }

      return null;
    });
    const clientA = createClient();
    const clientB = createClient();
    (createMCPClient as jest.Mock)
      .mockResolvedValueOnce(clientA)
      .mockResolvedValueOnce(clientB);

    await service.getOrCreateClient(enabledServer.id);
    await service.getOrCreateClient(disabledServer.id);
    await service.onModuleDestroy();

    expect(clientA.close).toHaveBeenCalledTimes(1);
    expect(clientB.close).toHaveBeenCalledTimes(1);
  });

  it('rejects runtime access for disabled servers', async () => {
    mcpServerRepository.findOne.mockResolvedValue(disabledServer);

    await expect(service.getOrCreateClient(disabledServer.id)).rejects.toThrow(
      `MCP server "${disabledServer.name}" (${disabledServer.id}) is disabled`,
    );
    expect(createMCPClient).not.toHaveBeenCalled();
  });

  it('allows diagnostics tools discovery for disabled servers', async () => {
    mcpServerRepository.findOne.mockResolvedValue(disabledServer);
    const client = createClient(['calculator']);
    (createMCPClient as jest.Mock).mockResolvedValue(client);

    const result = await service.listToolsForDiagnostics(disabledServer.id);

    expect(result.server.enabled).toBe(false);
    expect(result.toolCount).toBe(1);
    expect(result.tools[0]?.serverId).toBe(disabledServer.id);
    expect(result.tools[0]?.id).toBe(`${disabledServer.id}:calculator`);
    expect(result.tools.map((tool) => tool.name)).toEqual(['calculator']);
  });

  it('maps credential to Authorization bearer header', async () => {
    mcpServerRepository.findOne.mockResolvedValue({
      ...enabledServer,
      credential: '33333333-3333-4333-8333-333333333333',
    });
    credentialService.findOneValue.mockResolvedValue('secret-token');
    const client = createClient();
    (createMCPClient as jest.Mock).mockResolvedValue(client);

    await service.getOrCreateClient(enabledServer.id);

    expect(credentialService.findOneValue).toHaveBeenCalledWith(
      '33333333-3333-4333-8333-333333333333',
    );
    expect(createMCPClient).toHaveBeenCalledWith(
      expect.objectContaining({
        transport: expect.objectContaining({
          type: 'http',
          headers: {
            Authorization: 'Bearer secret-token',
          },
        }),
      }),
    );
  });

  it('creates stdio transport with command, args and cwd', async () => {
    const previousGoogleOAuthCredentials = process.env.GOOGLE_OAUTH_CREDENTIALS;
    process.env.GOOGLE_OAUTH_CREDENTIALS = '/tmp/gcp-oauth.keys.json';
    try {
      mcpServerRepository.findOne.mockResolvedValue(stdioServer);
      const client = createClient();
      (createMCPClient as jest.Mock).mockResolvedValue(client);

      await service.getOrCreateClient(stdioServer.id);

      const config = (createMCPClient as jest.Mock).mock.calls[0][0] as {
        transport: Experimental_StdioMCPTransport;
      };
      expect(config.transport).toBeInstanceOf(Experimental_StdioMCPTransport);
      expect((config.transport as any).serverParams).toEqual(
        expect.objectContaining({
          command: stdioServer.command,
          args: stdioServer.args,
          cwd: stdioServer.cwd,
          stderr: 'pipe',
          env: expect.objectContaining({
            GOOGLE_OAUTH_CREDENTIALS: '/tmp/gcp-oauth.keys.json',
          }),
        }),
      );
    } finally {
      if (previousGoogleOAuthCredentials === undefined) {
        delete process.env.GOOGLE_OAUTH_CREDENTIALS;
      } else {
        process.env.GOOGLE_OAUTH_CREDENTIALS = previousGoogleOAuthCredentials;
      }
    }
  });

  it('rejects stdio servers with credentials', async () => {
    mcpServerRepository.findOne.mockResolvedValue({
      ...stdioServer,
      credential: '33333333-3333-4333-8333-333333333334',
    });

    await expect(service.getOrCreateClient(stdioServer.id)).rejects.toThrow(
      `Credential is not supported for stdio MCP server "${stdioServer.name}"`,
    );
    expect(createMCPClient).not.toHaveBeenCalled();
  });

  it('invalidates pooled client when stdio settings change', async () => {
    mcpServerRepository.findOne
      .mockResolvedValueOnce(stdioServer)
      .mockResolvedValueOnce({
        ...stdioServer,
        args: ['-y', '@modelcontextprotocol/server-git'],
      });

    const firstClient = createClient();
    const secondClient = createClient();
    (createMCPClient as jest.Mock)
      .mockResolvedValueOnce(firstClient)
      .mockResolvedValueOnce(secondClient);

    await service.getOrCreateClient(stdioServer.id);
    await service.getOrCreateClient(stdioServer.id);

    expect(firstClient.close).toHaveBeenCalledTimes(1);
    expect(createMCPClient).toHaveBeenCalledTimes(2);
  });

  it('returns a failure diagnostics payload when connectivity fails', async () => {
    mcpServerRepository.findOne.mockResolvedValue(enabledServer);
    (createMCPClient as jest.Mock).mockRejectedValue(
      new Error('Connection refused'),
    );

    const result = await service.testServer(enabledServer.id);

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Connection refused');
    expect(result.toolCount).toBe(0);
  });

  it('prefers captured stderr output over generic connection-closed errors', async () => {
    mcpServerRepository.findOne.mockResolvedValue(stdioServer);
    (createMCPClient as jest.Mock).mockImplementation(async () => {
      (service as any).stdioCapturedStderr.set(
        stdioServer.id,
        [
          'Failed to start server: Error loading OAuth keys',
          '1. Set GOOGLE_OAUTH_CREDENTIALS',
        ].join('\n'),
      );
      throw new Error('Connection closed');
    });

    const result = await service.testServer(stdioServer.id);

    expect(result.ok).toBe(false);
    expect(result.error).toContain(
      'Failed to start server: Error loading OAuth keys',
    );
    expect(result.error).toContain('GOOGLE_OAUTH_CREDENTIALS');
  });

  it('builds namespaced ToolSet and respects requested tool names', async () => {
    mcpServerRepository.findOne.mockResolvedValue(enabledServer);
    const client = createClient(['calculator', 'search', 'translate']);
    (createMCPClient as jest.Mock).mockResolvedValue(client);

    const result = await service.buildToolSet({
      planner: {
        settings: {
          server_id: enabledServer.id,
          tool_names: ['calculator', 'translate'],
        },
      },
      helper: {
        settings: {
          server_id: enabledServer.id,
        },
      },
    });

    expect(Object.keys(result)).toEqual([
      'planner__calculator',
      'planner__translate',
      'helper__calculator',
      'helper__search',
      'helper__translate',
    ]);
    expect(client.toolsFromDefinitions).toHaveBeenCalledTimes(2);
    const firstDefinitions = client.toolsFromDefinitions.mock.calls[0][0];
    expect(
      firstDefinitions.tools.map((tool: { name: string }) => tool.name),
    ).toEqual(['calculator', 'translate']);
  });

  it('validates required server_id using mcp binding path', async () => {
    await expect(
      service.buildToolSet({
        planner: {
          settings: {},
        },
      }),
    ).rejects.toThrow('bindings.mcp.planner.settings.server_id is required');
  });
});
