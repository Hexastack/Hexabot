/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';

import {
  installUserFixturesTypeOrm,
  userFixtureIds,
} from '@/utils/test/fixtures/user';
import {
  closeTypeOrmConnections,
  getLastTypeOrmDataSource,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { WorkflowVersionOrmEntity } from '../entities/workflow-version.entity';
import { WorkflowOrmEntity } from '../entities/workflow.entity';
import { WorkflowType, WorkflowVersionAction } from '../types';

import { WorkflowVersionService } from './workflow-version.service';

describe('WorkflowVersionService (TypeORM)', () => {
  let module: TestingModule;
  let workflowVersionService: WorkflowVersionService;
  let workflowRepository: Repository<WorkflowOrmEntity>;
  let versionRepository: Repository<WorkflowVersionOrmEntity>;

  const createWorkflow = async (
    overrides: Partial<WorkflowOrmEntity> = {},
  ): Promise<WorkflowOrmEntity> => {
    const workflow = workflowRepository.create({
      name: `workflow_${randomUUID()}`,
      description: 'Workflow for version service tests.',
      type: WorkflowType.conversational,
      schedule: null,
      memoryDefinitions: [],
      createdBy: { id: userFixtureIds.admin },
      ...overrides,
    });

    return await workflowRepository.save(workflow);
  };
  const createVersion = async ({
    workflowId,
    version,
    definitionYml,
    action = WorkflowVersionAction.create,
    createdById = userFixtureIds.admin,
    parentVersionId = null,
  }: {
    workflowId: string;
    version: number;
    definitionYml: string;
    action?: WorkflowVersionAction;
    createdById?: string | null;
    parentVersionId?: string | null;
  }): Promise<WorkflowVersionOrmEntity> => {
    const entity = versionRepository.create({
      workflow: { id: workflowId },
      version,
      definitionYml,
      checksum: WorkflowVersionService.computeChecksum(definitionYml),
      action,
      createdBy: createdById ? { id: createdById } : null,
      parentVersion: parentVersionId ? { id: parentVersionId } : null,
    });

    return await versionRepository.save(entity);
  };

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [WorkflowVersionService],
      typeorm: {
        fixtures: [installUserFixturesTypeOrm],
      },
    });

    module = testing.module;
    [workflowVersionService] = await testing.getMocks([WorkflowVersionService]);
    const dataSource = getLastTypeOrmDataSource();
    workflowRepository = dataSource.getRepository(WorkflowOrmEntity);
    versionRepository = dataSource.getRepository(WorkflowVersionOrmEntity);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('findByWorkflow', () => {
    it('returns versions ordered by version desc for the workflow', async () => {
      const workflow = await createWorkflow();
      const otherWorkflow = await createWorkflow();
      const first = await createVersion({
        workflowId: workflow.id,
        version: 1,
        definitionYml: 'version: 1',
      });
      const second = await createVersion({
        workflowId: workflow.id,
        version: 2,
        definitionYml: 'version: 2',
        action: WorkflowVersionAction.update,
        parentVersionId: first.id,
      });
      await createVersion({
        workflowId: otherWorkflow.id,
        version: 1,
        definitionYml: 'version: other',
      });

      const results = await workflowVersionService.findByWorkflow(workflow.id);

      expect(results).toHaveLength(2);
      expect(results.map((version) => version.version)).toEqual([2, 1]);
      expect(results.map((version) => version.workflow)).toEqual([
        workflow.id,
        workflow.id,
      ]);
      expect(results[0]?.id).toBe(second.id);
      expect(results[1]?.id).toBe(first.id);
    });
  });

  describe('findOneByWorkflow', () => {
    it('returns the matching version for a workflow', async () => {
      const workflow = await createWorkflow();
      const version = await createVersion({
        workflowId: workflow.id,
        version: 1,
        definitionYml: 'version: 1',
      });
      const result = await workflowVersionService.findOneByWorkflow(
        workflow.id,
        version.id,
      );

      expect(result).not.toBeNull();
      expect(result?.id).toBe(version.id);
      expect(result?.workflow).toBe(workflow.id);
    });

    it('returns null when the workflow does not match the version', async () => {
      const workflow = await createWorkflow();
      const otherWorkflow = await createWorkflow();
      const version = await createVersion({
        workflowId: workflow.id,
        version: 1,
        definitionYml: 'version: 1',
      });
      const result = await workflowVersionService.findOneByWorkflow(
        otherWorkflow.id,
        version.id,
      );

      expect(result).toBeNull();
    });
  });

  describe('createSnapshot', () => {
    it('creates the first version when none exist', async () => {
      const workflow = await createWorkflow();
      const definitionYml = 'version: 1';
      const created = await workflowVersionService.createSnapshot({
        workflow: workflow.id,
        definitionYml,
        message: 'Initial version',
        action: WorkflowVersionAction.create,
        createdBy: userFixtureIds.admin,
      });

      expect(created.version).toBe(1);
      expect(created.checksum).toBe(
        WorkflowVersionService.computeChecksum(definitionYml),
      );
      expect(created.workflow).toBe(workflow.id);
      expect(created.message).toBe('Initial version');
      expect(created.createdBy).toBe(userFixtureIds.admin);
      expect(created.parentVersionId ?? null).toBeNull();
    });

    it('increments version and maps parent/creator fields', async () => {
      const workflow = await createWorkflow();
      const initialDefinition = 'version: 1';
      const initial = await workflowVersionService.createSnapshot({
        workflow: workflow.id,
        definitionYml: initialDefinition,
        action: WorkflowVersionAction.create,
        createdBy: userFixtureIds.admin,
      });
      const updatedDefinition = 'version: 2';
      const created = await workflowVersionService.createSnapshot({
        workflow: workflow.id,
        definitionYml: updatedDefinition,
        message: 'Update workflow',
        action: WorkflowVersionAction.update,
        parentVersionId: initial.id,
        createdBy: userFixtureIds.admin,
      });

      expect(created.version).toBe(initial.version + 1);
      expect(created.checksum).toBe(
        WorkflowVersionService.computeChecksum(updatedDefinition),
      );
      expect(created.parentVersionId).toBe(initial.id);
      expect(created.createdBy).toBe(userFixtureIds.admin);
      expect(created.message).toBe('Update workflow');
    });
  });
});
