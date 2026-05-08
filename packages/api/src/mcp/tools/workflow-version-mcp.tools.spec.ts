/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BadRequestException } from '@nestjs/common';

import { WorkflowOrmEntity } from '@/workflow/entities/workflow.entity';
import { WorkflowVersionAction } from '@/workflow/types';

import type { HexabotMcpRequest } from '../types';

import { HexabotWorkflowMcpHelper } from './workflow-mcp.helper';
import { HexabotWorkflowVersionMcpTools } from './workflow-version-mcp.tools';

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
});
const defaultWorkflowVersionService = () => ({
  commit: jest.fn(),
  restoreVersion: jest.fn(),
});
const buildWorkflowHelper = (
  workflowService: Record<string, unknown>,
  workflowVersionService: Record<string, unknown>,
) =>
  new HexabotWorkflowMcpHelper(
    workflowService as any,
    workflowVersionService as any,
  );
const buildWorkflowVersionTools = (overrides: Record<string, unknown> = {}) => {
  const workflowService = overrides.workflowService ?? defaultWorkflowService();
  const workflowVersionService =
    overrides.workflowVersionService ?? defaultWorkflowVersionService();
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

  return new HexabotWorkflowVersionMcpTools(
    workflowVersionService as any,
    actionService as any,
    runtimeBindingsService as any,
    buildWorkflowHelper(
      workflowService as Record<string, unknown>,
      workflowVersionService as Record<string, unknown>,
    ),
  );
};

describe('HexabotWorkflowVersionMcpTools', () => {
  it('validates and commits workflow YAML versions', async () => {
    const workflowVersion = { id: 'version-id', version: 1 };
    const workflowVersionService = {
      commit: jest.fn().mockResolvedValue(workflowVersion),
    };
    const tools = buildWorkflowVersionTools({ workflowVersionService });

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
    const tools = buildWorkflowVersionTools({
      workflowService,
      workflowVersionService,
    });

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
    const tools = buildWorkflowVersionTools({ workflowVersionService });

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

  it('rejects invalid workflow YAML before committing a version', async () => {
    const workflowVersionService = {
      commit: jest.fn(),
    };
    const tools = buildWorkflowVersionTools({ workflowVersionService });

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
    const tools = buildWorkflowVersionTools();

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
    const tools = buildWorkflowVersionTools();

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
    const tools = buildWorkflowVersionTools({ actionService });

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
});
