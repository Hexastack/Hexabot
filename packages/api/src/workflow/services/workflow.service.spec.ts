/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowDefinition } from '@hexabot-ai/agentic';
import { TestingModule } from '@nestjs/testing';

import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { Workflow } from '../dto/workflow.dto';
import { WorkflowOrmEntity } from '../entities/workflow.entity';
import { WorkflowRepository } from '../repositories/workflow.repository';

import { WorkflowService } from './workflow.service';

describe('WorkflowService (TypeORM)', () => {
  let module: TestingModule;
  let workflowService: WorkflowService;
  let workflowRepository: WorkflowRepository;
  let workflow: Workflow;
  let counter = 0;

  const buildWorkflowDefinition = (): WorkflowDefinition => ({
    workflow: {
      name: `Test workflow ${++counter}`,
      version: `1.0.${counter}`,
      description: 'Test workflow definition',
    },
    tasks: {
      greet: { action: 'greet' },
    },
    flow: [{ do: 'greet' }],
    outputs: { result: '=1' },
  });

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [WorkflowService, WorkflowRepository],
      typeorm: {
        entities: [WorkflowOrmEntity],
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

    const definition = buildWorkflowDefinition();
    workflow = await workflowService.create({
      name: definition.workflow.name,
      version: definition.workflow.version,
      description: definition.workflow.description,
      definition,
      source: 'source: test',
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
      source: 'source: test',
      definition: workflow.definition,
    });
  });

  it('enforces unique name/version pairs', async () => {
    const duplicatePayload = {
      name: workflow.name,
      version: workflow.version,
      description: workflow.description ?? undefined,
      definition: workflow.definition,
    };

    await expect(workflowService.create(duplicatePayload)).rejects.toThrow();
  });
});
