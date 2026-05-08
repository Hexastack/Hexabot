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

  it('returns current and published workflow version status without YAML payloads', async () => {
    const currentVersion = {
      id: 'current-version-id',
      version: 3,
      definitionYml: 'defs: {}\nflow: []\noutputs: {}\n',
      checksum: 'current-checksum',
      message: 'Draft update',
      action: WorkflowVersionAction.update,
      parentVersion: 'published-version-id',
      workflow: 'workflow-id',
      createdBy: actor.id,
      createdAt: new Date('2026-05-08T10:00:00.000Z'),
      updatedAt: new Date('2026-05-08T10:00:00.000Z'),
    };
    const publishedVersion = {
      id: 'published-version-id',
      version: 2,
      definitionYml: 'defs: {}\nflow: []\noutputs: {}\n',
      checksum: 'published-checksum',
      message: 'Published update',
      action: WorkflowVersionAction.update,
      parentVersion: null,
      workflow: 'workflow-id',
      createdBy: actor.id,
      createdAt: new Date('2026-05-08T09:00:00.000Z'),
      updatedAt: new Date('2026-05-08T09:00:00.000Z'),
    };
    const workflowService = {
      findOneAndPopulate: jest.fn().mockResolvedValue({
        id: 'workflow-id',
        name: 'Support triage',
        type: WorkflowType.manual,
        currentVersion,
        publishedVersion,
      }),
    };
    const tools = buildTools({ workflowService });
    const result = await tools.getWorkflowVersionStatus({
      id: 'workflow-id',
    });

    expect(result).toEqual({
      workflow: {
        id: 'workflow-id',
        name: 'Support triage',
        type: WorkflowType.manual,
      },
      currentVersion: {
        id: 'current-version-id',
        version: 3,
        checksum: 'current-checksum',
        message: 'Draft update',
        action: WorkflowVersionAction.update,
        parentVersion: 'published-version-id',
        workflow: 'workflow-id',
        createdBy: actor.id,
        createdAt: currentVersion.createdAt,
        updatedAt: currentVersion.updatedAt,
      },
      publishedVersion: {
        id: 'published-version-id',
        version: 2,
        checksum: 'published-checksum',
        message: 'Published update',
        action: WorkflowVersionAction.update,
        parentVersion: null,
        workflow: 'workflow-id',
        createdBy: actor.id,
        createdAt: publishedVersion.createdAt,
        updatedAt: publishedVersion.updatedAt,
      },
      currentVersionId: 'current-version-id',
      publishedVersionId: 'published-version-id',
      isPublished: true,
      isCurrentVersionPublished: false,
      hasUnpublishedChanges: true,
    });
    expect(result.currentVersion).not.toHaveProperty('definitionYml');
    expect(result.publishedVersion).not.toHaveProperty('definitionYml');
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

  it('uses the current workflow version as the default commit parent', async () => {
    const workflowVersion = { id: 'version-id', version: 4 };
    const workflowService = {
      findOneAndPopulate: jest.fn().mockResolvedValue({
        id: 'workflow-id',
        currentVersion: { id: 'current-version-id' },
      }),
    };
    const workflowVersionService = {
      commit: jest.fn().mockResolvedValue(workflowVersion),
    };
    const tools = buildTools({ workflowService, workflowVersionService });

    await expect(
      tools.commitWorkflowYaml(
        {
          workflowId: 'workflow-id',
          definitionYml: WorkflowOrmEntity.BLANK_DEFINITION_YML,
          message: 'draft change',
          action: WorkflowVersionAction.update,
        },
        {},
        request,
      ),
    ).resolves.toEqual(workflowVersion);

    expect(workflowVersionService.commit).toHaveBeenCalledWith(
      expect.objectContaining({
        workflow: 'workflow-id',
        parentVersion: 'current-version-id',
        createdBy: actor.id,
      }),
    );
  });

  it('rolls back workflow YAML by creating a restore snapshot', async () => {
    const restoredVersion = { id: 'restored-version-id', version: 5 };
    const workflowVersionService = {
      restoreVersion: jest.fn().mockResolvedValue(restoredVersion),
    };
    const tools = buildTools({ workflowVersionService });

    await expect(
      tools.rollbackWorkflowVersion(
        {
          workflowId: 'workflow-id',
          versionId: 'target-version-id',
          message: 'Rollback to production-safe version',
        },
        {},
        request,
      ),
    ).resolves.toEqual(restoredVersion);

    expect(workflowVersionService.restoreVersion).toHaveBeenCalledWith(
      'workflow-id',
      'target-version-id',
      {
        updatedBy: actor.id,
        message: 'Rollback to production-safe version',
      },
    );
  });

  it('publishes the current workflow version', async () => {
    const publishedWorkflow = {
      id: 'workflow-id',
      currentVersion: { id: 'current-version-id' },
      publishedVersion: { id: 'current-version-id' },
    };
    const workflowService = {
      findOne: jest.fn().mockResolvedValue({
        id: 'workflow-id',
        currentVersion: 'current-version-id',
      }),
      updateOne: jest.fn().mockResolvedValue({
        id: 'workflow-id',
        currentVersion: 'current-version-id',
        publishedVersion: 'current-version-id',
      }),
      findOneAndPopulate: jest.fn().mockResolvedValue(publishedWorkflow),
    };
    const tools = buildTools({ workflowService });

    await expect(tools.publishWorkflow({ id: 'workflow-id' })).resolves.toEqual(
      publishedWorkflow,
    );
    expect(workflowService.updateOne).toHaveBeenCalledWith('workflow-id', {
      publishedVersion: 'current-version-id',
    });
  });

  it('unpublishes the workflow without changing the current version', async () => {
    const currentWorkflow = {
      id: 'workflow-id',
      currentVersion: { id: 'current-version-id' },
      publishedVersion: { id: 'current-version-id' },
    };
    const unpublishedWorkflow = {
      ...currentWorkflow,
      publishedVersion: null,
    };
    const workflowService = {
      findOneAndPopulate: jest
        .fn()
        .mockResolvedValueOnce(currentWorkflow)
        .mockResolvedValueOnce(unpublishedWorkflow),
      updateOne: jest.fn().mockResolvedValue({
        id: 'workflow-id',
        currentVersion: 'current-version-id',
        publishedVersion: null,
      }),
    };
    const tools = buildTools({ workflowService });

    await expect(
      tools.unpublishWorkflow({ id: 'workflow-id' }),
    ).resolves.toEqual(unpublishedWorkflow);
    expect(workflowService.updateOne).toHaveBeenCalledWith('workflow-id', {
      publishedVersion: null,
    });
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

  it('returns workflow run debugging context with related runs and YAML', async () => {
    const run = {
      id: 'run-id',
      status: 'failed',
      workflow: {
        id: 'workflow-id',
        name: 'Support triage',
        type: WorkflowType.manual,
      },
      workflowVersion: {
        id: 'version-id',
        version: 3,
        checksum: 'checksum',
        definitionYml: 'defs: {}\nflow: []\noutputs: {}\n',
      },
      parentRun: { id: 'parent-run-id' },
      stepLog: {
        send_reply: {
          id: 'send_reply',
          name: 'Send reply',
          action: 'send_message',
          status: 'failed',
          error: { message: 'Template is missing' },
        },
      },
      error: 'Template is missing',
      duration: 125,
      createdAt: '2026-05-08T10:00:00.000Z',
      updatedAt: '2026-05-08T10:00:01.000Z',
    };
    const parentRun = { id: 'parent-run-id', status: 'suspended' };
    const childRun = { id: 'child-run-id', status: 'finished' };
    const workflowRunService = {
      findOneAndPopulate: jest.fn().mockImplementation((id: string) => {
        if (id === 'run-id') {
          return Promise.resolve(run);
        }
        if (id === 'parent-run-id') {
          return Promise.resolve(parentRun);
        }

        return Promise.resolve(null);
      }),
      findAndPopulate: jest.fn().mockResolvedValue([childRun]),
      count: jest.fn().mockResolvedValue(1),
    };
    const tools = buildTools({ workflowRunService });

    await expect(
      tools.debugWorkflowRun({
        id: 'run-id',
        childRunsLimit: 5,
      }),
    ).resolves.toEqual({
      run,
      workflowDefinitionYml: run.workflowVersion.definitionYml,
      relatedRuns: {
        parent: parentRun,
        children: [childRun],
        childRunTotal: 1,
        childRunsLimit: 5,
      },
      summary: expect.objectContaining({
        id: 'run-id',
        status: 'failed',
        workflow: {
          id: 'workflow-id',
          name: 'Support triage',
          type: WorkflowType.manual,
        },
        workflowVersion: {
          id: 'version-id',
          version: 3,
          checksum: 'checksum',
        },
        error: 'Template is missing',
        duration: 125,
        stepStatusCounts: { failed: 1 },
        failedSteps: [
          {
            id: 'send_reply',
            name: 'Send reply',
            action: 'send_message',
            status: 'failed',
            error: { message: 'Template is missing' },
            reason: null,
          },
        ],
        childRunTotal: 1,
      }),
    });

    expect(workflowRunService.findAndPopulate).toHaveBeenCalledWith({
      where: { parentRun: { id: 'run-id' } },
      order: { createdAt: 'ASC' },
      take: 5,
    });
    expect(workflowRunService.count).toHaveBeenCalledWith({
      where: { parentRun: { id: 'run-id' } },
    });
  });

  it('can inspect a workflow run without related runs or YAML', async () => {
    const run = {
      id: 'run-id',
      status: 'suspended',
      workflow: {
        id: 'workflow-id',
        name: 'Manual workflow',
        type: WorkflowType.manual,
      },
      workflowVersion: null,
      parentRun: null,
      stepLog: null,
      suspendedStep: 'await_reply',
      suspensionReason: 'Waiting for user',
      suspensionStepExecId: 'exec-id',
      suspensionIndex: 1,
      suspensionKey: 'reply',
    };
    const workflowRunService = {
      findOneAndPopulate: jest.fn().mockResolvedValue(run),
      findAndPopulate: jest.fn(),
      count: jest.fn(),
    };
    const tools = buildTools({ workflowRunService });
    const result = await tools.debugWorkflowRun({
      id: 'run-id',
      includeRelatedRuns: false,
      includeWorkflowDefinition: false,
    });

    expect(result).not.toHaveProperty('workflowDefinitionYml');
    expect(result).toEqual(
      expect.objectContaining({
        run,
        relatedRuns: {
          parent: null,
          children: [],
          childRunTotal: 0,
          childRunsLimit: 0,
        },
        summary: expect.objectContaining({
          status: 'suspended',
          suspension: {
            step: 'await_reply',
            reason: 'Waiting for user',
            stepExecId: 'exec-id',
            index: 1,
            key: 'reply',
          },
        }),
      }),
    );
    expect(workflowRunService.findAndPopulate).not.toHaveBeenCalled();
    expect(workflowRunService.count).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when a workflow run debug target is missing', async () => {
    const workflowRunService = {
      findOneAndPopulate: jest.fn().mockResolvedValue(null),
    };
    const tools = buildTools({ workflowRunService });

    await expect(
      tools.debugWorkflowRun({ id: 'missing-run-id' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
