/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createHash } from 'crypto';

import {
  WorkflowDefinition,
  Workflow as WorkflowHelper,
} from '@hexabot-ai/agentic';
import { TestingModule } from '@nestjs/testing';

import {
  installUserFixturesTypeOrm,
  userFixtureIds,
} from '@/utils/test/fixtures/user';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { Workflow } from '../dto/workflow.dto';
import { WorkflowVersionOrmEntity } from '../entities/workflow-version.entity';
import { WorkflowRepository } from '../repositories/workflow.repository';
import { WorkflowType, WorkflowVersionAction } from '../types';

import { WorkflowVersionService } from './workflow-version.service';
import { WorkflowService } from './workflow.service';

describe('WorkflowService (TypeORM)', () => {
  let module: TestingModule;
  let workflowService: WorkflowService;
  let workflowRepository: WorkflowRepository;
  let workflow: Workflow;
  let workflowDefinition: WorkflowDefinition;
  let counter = 0;
  let creatorId: string;

  const buildWorkflowDefinition = (): WorkflowDefinition => ({
    tasks: {
      greet: { action: 'greet' },
    },
    flow: [{ do: 'greet' }],
    outputs: { result: '=1' },
  });

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [WorkflowService],
      typeorm: {
        fixtures: installUserFixturesTypeOrm,
      },
    });

    module = testing.module;
    [workflowService, workflowRepository] = await testing.getMocks([
      WorkflowService,
      WorkflowRepository,
    ]);
  });

  beforeEach(async () => {
    await workflowRepository.deleteMany();
    creatorId = userFixtureIds.admin;

    workflowDefinition = buildWorkflowDefinition();
    workflow = await workflowService.create({
      name: `Test workflow ${++counter}`,
      description: 'Test workflow definition',
      definitionYml: WorkflowHelper.stringifyDefinition(workflowDefinition),
      type: WorkflowType.conversational,
      schedule: null,
      createdBy: creatorId,
      memoryDefinitions: [],
    });
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

  it('creates workflows and returns stored definitions', async () => {
    const stored = await workflowService.findOneAndPopulate(workflow.id);

    expect(stored).not.toBeNull();
    expect(stored).toMatchObject({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      definition: workflowDefinition,
      type: WorkflowType.conversational,
      schedule: null,
    });
    const definitionYml =
      WorkflowHelper.stringifyDefinition(workflowDefinition);
    expect(stored?.currentVersion).toEqualPayload({
      action: 'create',
      workflow: workflow.id,
      checksum: WorkflowVersionService.computeChecksum(definitionYml),
      definitionYml,
      version: 1,
      createdBy: stored?.createdBy.id,
      message: null,
      parentVersionId: null,
    });
  });

  it('serializes YAML from definitions before persistence', async () => {
    const repository = workflowRepository
      .getManager()
      .getRepository(WorkflowVersionOrmEntity);
    const version = await repository.findOne({
      where: { workflow: { id: workflow.id } },
    });
    const expectedYml = WorkflowHelper.stringifyDefinition(workflowDefinition);

    expect(version?.definitionYml).toBe(expectedYml);
    expect(version?.checksum).toBe(
      createHash('sha256').update(expectedYml).digest('hex'),
    );
    expect(version?.action).toBe(WorkflowVersionAction.create);
  });

  it('creates a new version when definition changes', async () => {
    const updatedDefinition = buildWorkflowDefinition();
    updatedDefinition.outputs = { result: '=2' };

    const updated = await workflowService.updateOne(workflow.id, {
      definitionYml: WorkflowHelper.stringifyDefinition(updatedDefinition),
      message: 'Update definition',
    });
    const versionRepository = workflowRepository
      .getManager()
      .getRepository(WorkflowVersionOrmEntity);
    const versions = await versionRepository.find({
      where: { workflow: { id: workflow.id } },
      order: { version: 'ASC' },
      relations: ['parentVersion'],
    });

    expect(versions).toHaveLength(2);
    expect(versions[1]?.action).toBe(WorkflowVersionAction.update);
    expect(versions[1]?.parentVersion?.id).toBe(versions[0]?.id);
    expect(updated.currentVersion).toBe(versions[1]?.id);
  });

  it('enforces unique name/version pairs', async () => {
    const duplicatePayload = {
      name: workflow.name,
      description: workflow.description ?? undefined,
      definitionYml: WorkflowHelper.stringifyDefinition(workflowDefinition),
      type: WorkflowType.conversational,
      schedule: null,
      createdBy: creatorId,
      memoryDefinitions: [],
    };

    await expect(workflowService.create(duplicatePayload)).rejects.toThrow();
  });

  it('returns the latest workflow when one exists', async () => {
    const picked = await workflowService.pickWorkflow();

    expect(picked?.id).toBe(workflow.id);
    expect(picked?.name).toBe(workflow.name);
  });

  it('returns null when no workflows exist', async () => {
    await workflowRepository.deleteMany();

    const picked = await workflowService.pickWorkflow();

    expect(picked).toBeNull();
  });
});
