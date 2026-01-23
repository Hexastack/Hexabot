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
    WorkflowOrmEntity.registerEntityManagerProvider(
      () => workflowRepository.manager,
    );
    WorkflowVersionOrmEntity.registerEntityManagerProvider(
      () => dataSource.getRepository(WorkflowVersionOrmEntity).manager,
    );
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
        WorkflowVersionOrmEntity.computeChecksum(definitionYml),
      );
      expect(created.workflow).toBe(workflow.id);
      expect(created.message).toBe('Initial version');
      expect(created.createdBy).toBe(userFixtureIds.admin);
      expect(created.parentVersion ?? null).toBeNull();
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
        parentVersion: initial.id,
        createdBy: userFixtureIds.admin,
      });

      expect(created.version).toBe(initial.version + 1);
      expect(created.checksum).toBe(
        WorkflowVersionOrmEntity.computeChecksum(updatedDefinition),
      );
      expect(created.parentVersion).toBe(initial.id);
      expect(created.createdBy).toBe(userFixtureIds.admin);
      expect(created.message).toBe('Update workflow');
    });
  });
});
