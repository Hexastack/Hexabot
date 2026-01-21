/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Workflow as AgenticWorkflow,
  WorkflowDefinition,
} from '@hexabot-ai/agentic';
import { TestingModule } from '@nestjs/testing';

import {
  installUserFixturesTypeOrm,
  userFixtureIds,
} from '@/utils/test/fixtures/user';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { Workflow } from '../dto/workflow.dto';
import { WorkflowOrmEntity } from '../entities/workflow.entity';
import { WorkflowRepository } from '../repositories/workflow.repository';
import { WorkflowType } from '../types';

import { WorkflowService } from './workflow.service';

describe('WorkflowService (TypeORM)', () => {
  let module: TestingModule;
  let workflowService: WorkflowService;
  let workflowRepository: WorkflowRepository;
  let workflow: Workflow;
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

    const definition = buildWorkflowDefinition();
    workflow = await workflowService.create({
      name: `Test workflow ${++counter}`,
      version: `1.0.${counter}`,
      description: 'Test workflow definition',
      definition,
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
    const stored = await workflowService.findOne(workflow.id);

    expect(stored).not.toBeNull();
    expect(stored).toMatchObject({
      id: workflow.id,
      name: workflow.name,
      version: workflow.version,
      description: workflow.description,
      definition: workflow.definition,
      type: WorkflowType.conversational,
      schedule: null,
    });
  });

  it('serializes YAML from definitions before persistence', async () => {
    const repository = workflowRepository
      .getManager()
      .getRepository(WorkflowOrmEntity);
    const entity = await repository.findOne({
      where: { id: workflow.id },
    });

    expect(entity?.definitionYaml).toBe(
      AgenticWorkflow.stringifyDefinition(workflow.definition),
    );
  });

  it('enforces unique name/version pairs', async () => {
    const duplicatePayload = {
      name: workflow.name,
      version: workflow.version,
      description: workflow.description ?? undefined,
      definition: workflow.definition,
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
