/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { NotFoundException } from '@nestjs/common';

import { WorkflowType } from '@/workflow/types';

import type { HexabotMcpRequest } from '../types';

import { HexabotWorkflowRunMcpTools } from './workflow-run-mcp.tools';

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
const defaultWorkflowService = () => ({
  findOneAndPopulate: jest.fn().mockResolvedValue({ id: 'workflow-id' }),
  findOne: jest.fn(),
  validateManualInput: jest.fn(),
});
const buildWorkflowRunTools = (overrides: Record<string, unknown> = {}) => {
  const workflowService = overrides.workflowService ?? defaultWorkflowService();
  const workflowRunService = overrides.workflowRunService ?? ({} as any);
  const agenticService = overrides.agenticService ?? ({} as any);

  return new HexabotWorkflowRunMcpTools(
    workflowService as any,
    workflowRunService as any,
    agenticService as any,
  );
};

describe('HexabotWorkflowRunMcpTools', () => {
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
    const tools = buildWorkflowRunTools({ workflowService, agenticService });

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
    const tools = buildWorkflowRunTools({ workflowRunService });

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
    const tools = buildWorkflowRunTools({ workflowRunService });
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
    const tools = buildWorkflowRunTools({ workflowRunService });

    await expect(
      tools.debugWorkflowRun({ id: 'missing-run-id' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
