/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { WorkflowOrmEntity } from '@/workflow/entities/workflow.entity';
import {
  McpServerTransport,
  WorkflowType,
  WorkflowVersionAction,
} from '@/workflow/types';

import { HexabotMcpRequest } from '../types';

import { HexabotMcpTools } from './hexabot-mcp.tools';

const actor = {
  id: 'user-id',
  email: 'agent@example.com',
  username: 'agent',
  roles: ['role-id'],
  state: true,
};
const request = {
  hexabotUser: actor,
} as HexabotMcpRequest;
const buildTools = (overrides: Record<string, unknown> = {}) => {
  const workflowService =
    overrides.workflowService ??
    ({
      findOneAndPopulate: jest.fn().mockResolvedValue({ id: 'workflow-id' }),
      findOne: jest.fn(),
      validateManualInput: jest.fn(),
    } as any);
  const workflowVersionService =
    overrides.workflowVersionService ??
    ({
      commit: jest.fn(),
    } as any);
  const workflowRunService = overrides.workflowRunService ?? ({} as any);
  const agenticService = overrides.agenticService ?? ({} as any);
  const memoryDefinitionService =
    overrides.memoryDefinitionService ?? ({} as any);
  const actionService =
    overrides.actionService ??
    ({
      getRegistry: jest.fn().mockReturnValue({}),
    } as any);
  const runtimeBindingsService =
    overrides.runtimeBindingsService ??
    ({
      getRegistry: jest.fn().mockReturnValue({}),
    } as any);
  const credentialService = overrides.credentialService ?? ({} as any);
  const contentTypeService = overrides.contentTypeService ?? ({} as any);
  const contentService = overrides.contentService ?? ({} as any);
  const mcpServerService = overrides.mcpServerService ?? ({} as any);

  return new HexabotMcpTools(
    workflowService as any,
    workflowVersionService as any,
    workflowRunService as any,
    agenticService as any,
    memoryDefinitionService as any,
    actionService as any,
    runtimeBindingsService as any,
    credentialService as any,
    contentTypeService as any,
    contentService as any,
    mcpServerService as any,
  );
};

describe('HexabotMcpTools', () => {
  it('masks credential values from MCP output', () => {
    const credential = HexabotMcpTools.sanitizeCredential({
      id: 'credential-id',
      name: 'openai',
      value: 'secret-token',
      owner: 'user-id',
    });

    expect(credential).not.toHaveProperty('value');
    expect(JSON.stringify(credential)).not.toContain('secret-token');
  });

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
    const tools = buildTools({ mcpServerService });
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
    const tools = buildTools({ mcpServerService });

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
    const tools = buildTools({ mcpServerService });

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
    const tools = buildTools({ mcpServerService });

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
    const tools = buildTools({ mcpServerService });

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

  it('validates and commits workflow YAML versions', async () => {
    const workflowVersion = { id: 'version-id', version: 1 };
    const workflowVersionService = {
      commit: jest.fn().mockResolvedValue(workflowVersion),
    };
    const tools = buildTools({ workflowVersionService });

    await expect(
      tools.commitWorkflowYaml(
        {
          workflowId: 'workflow-id',
          definitionYml: WorkflowOrmEntity.BLANK_DEFINITION_YML,
          message: 'initial workflow',
          action: WorkflowVersionAction.update,
        },
        {},
        request,
      ),
    ).resolves.toEqual(workflowVersion);

    expect(workflowVersionService.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        workflow: 'workflow-id',
        definitionYml: WorkflowOrmEntity.BLANK_DEFINITION_YML,
        createdBy: actor.id,
      }),
    );
  });

  it('rejects invalid workflow YAML before committing a version', async () => {
    const workflowVersionService = {
      commit: jest.fn(),
    };
    const tools = buildTools({ workflowVersionService });

    await expect(
      tools.commitWorkflowYaml(
        {
          workflowId: 'workflow-id',
          definitionYml: 'not: a hexabot workflow',
          action: WorkflowVersionAction.update,
        },
        {},
        request,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(workflowVersionService.commit).not.toHaveBeenCalled();
  });

  it('validates workflow YAML without committing a version', async () => {
    const tools = buildTools();

    await expect(
      tools.validateWorkflowYaml({
        definitionYml: WorkflowOrmEntity.BLANK_DEFINITION_YML,
      }),
    ).resolves.toEqual({
      valid: true,
      errors: [],
      definition: expect.objectContaining({
        defs: {},
        flow: [],
        outputs: {},
      }),
    });
  });

  it('returns structured workflow YAML validation errors', async () => {
    const tools = buildTools();

    await expect(
      tools.validateWorkflowYaml({
        definitionYml: 'not: a hexabot workflow',
      }),
    ).resolves.toEqual({
      valid: false,
      errors: expect.arrayContaining([expect.stringContaining('defs')]),
    });
  });

  it('validates workflow YAML against the installed action catalog by default', async () => {
    const actionService = {
      getRegistry: jest.fn().mockReturnValue({}),
    };
    const tools = buildTools({ actionService });

    await expect(
      tools.validateWorkflowYaml({
        definitionYml: `
defs:
  missing_action:
    kind: task
    action: unknown_action
flow:
  - do: missing_action
outputs:
  result: "=true"
`,
      }),
    ).resolves.toEqual({
      valid: false,
      errors: expect.arrayContaining([
        expect.stringContaining('unknown_action'),
      ]),
    });
  });

  it('returns the created workflow run summary for manual workflow execution', async () => {
    const run = { id: 'run-id', status: 'finished' };
    const workflowService = {
      findOne: jest.fn().mockResolvedValue({
        id: 'workflow-id',
        type: WorkflowType.manual,
        inputSchema: { type: 'object', properties: {} },
      }),
      validateManualInput: jest.fn().mockReturnValue({ prompt: 'hello' }),
    };
    const agenticService = {
      handleEvent: jest.fn().mockResolvedValue(run),
    };
    const tools = buildTools({ workflowService, agenticService });

    await expect(
      tools.runWorkflow(
        {
          workflowId: 'workflow-id',
          input: { prompt: 'hello' },
        },
        {},
        request,
      ),
    ).resolves.toEqual({ accepted: true, run });

    const [event] = agenticService.handleEvent.mock.calls[0];
    expect(event.getWorkflowId()).toBe('workflow-id');
    expect(event.getInitiator()).toEqual(actor);
    expect(workflowService.validateManualInput).toHaveBeenCalledWith(
      { prompt: 'hello' },
      { type: 'object', properties: {} },
    );
  });
});
