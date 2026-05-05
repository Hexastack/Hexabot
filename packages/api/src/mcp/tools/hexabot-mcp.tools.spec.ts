/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BadRequestException } from '@nestjs/common';

import { WorkflowOrmEntity } from '@/workflow/entities/workflow.entity';
import { WorkflowType, WorkflowVersionAction } from '@/workflow/types';

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
  const actionService = overrides.actionService ?? ({} as any);
  const runtimeBindingsService =
    overrides.runtimeBindingsService ??
    ({
      getRegistry: jest.fn().mockReturnValue({}),
    } as any);
  const credentialService = overrides.credentialService ?? ({} as any);
  const contentTypeService = overrides.contentTypeService ?? ({} as any);
  const contentService = overrides.contentService ?? ({} as any);

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
