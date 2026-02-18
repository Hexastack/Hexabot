/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  WorkflowDefinition,
  Workflow as WorkflowHelper,
} from '@hexabot-ai/agentic';
import { BadRequestException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { JSONSchema7 as JsonSchema } from 'json-schema';

import {
  installUserFixturesTypeOrm,
  userFixtureIds,
} from '@/utils/test/fixtures/user';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';
import {
  conversationalWorkflowInputJsonSchema,
  scheduledWorkflowInputJsonSchema,
} from '@/workflow/schemas/workflow-input-schemas';

import { Workflow, WorkflowUpdateDto } from '../dto/workflow.dto';
import { WorkflowRepository } from '../repositories/workflow.repository';
import { WorkflowType, WorkflowVersionAction } from '../types';

import { WorkflowVersionService } from './workflow-version.service';
import { WorkflowService } from './workflow.service';

describe('WorkflowService (TypeORM)', () => {
  let module: TestingModule;
  let workflowService: WorkflowService;
  let workflowVersionService: WorkflowVersionService;
  let workflowRepository: WorkflowRepository;
  let workflow: Workflow;
  let definitionYml: string;
  let counter = 0;
  let creatorId: string;

  const buildWorkflowDefinition = (): {
    metadata: { name: string; description: string };
    definition: WorkflowDefinition;
  } => {
    return {
      metadata: {
        name: `Test workflow ${++counter}`,
        description: 'Test workflow definition',
      },
      definition: {
        tasks: {
          greet: { action: 'greet' },
        },
        flow: [{ do: 'greet' }],
        outputs: { result: '=1' },
      },
    };
  };

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [WorkflowService, WorkflowVersionService],
      typeorm: {
        fixtures: installUserFixturesTypeOrm,
      },
    });

    module = testing.module;
    [workflowService, workflowVersionService, workflowRepository] =
      await testing.getMocks([
        WorkflowService,
        WorkflowVersionService,
        WorkflowRepository,
      ]);
  });

  beforeEach(async () => {
    await workflowRepository.deleteMany();
    creatorId = userFixtureIds.admin;

    const { metadata, definition } = buildWorkflowDefinition();
    workflow = await workflowService.create({
      name: metadata.name,
      description: metadata.description,
      type: WorkflowType.conversational,
      schedule: null,
      createdBy: creatorId,
      memoryDefinitions: [],
    });

    definitionYml = WorkflowHelper.stringifyDefinition(definition);
    const version = await workflowVersionService.commit({
      action: WorkflowVersionAction.create,
      definitionYml,
      workflow: workflow.id,
      createdBy: creatorId,
    });

    await workflowService.updateOne(workflow.id, {
      currentVersion: version.id,
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
      description: workflow.description,
      type: WorkflowType.conversational,
      schedule: null,
      inputSchema: conversationalWorkflowInputJsonSchema,
    });
  });

  it('serializes YAML from definitions before persistence', async () => {
    const entity = await workflowService.findOneAndPopulate({
      where: { id: workflow.id },
    });

    expect(entity?.definitionYml).toBe(definitionYml);
  });

  it('enforces unique name', async () => {
    const duplicatePayload = {
      name: workflow.name,
      description: workflow.description ?? undefined,
      type: WorkflowType.conversational,
      schedule: null,
      createdBy: creatorId,
      memoryDefinitions: [],
    };

    await expect(workflowService.create(duplicatePayload)).rejects.toThrow();
  });

  it('keeps the fixed conversational input schema on create', async () => {
    const customSchema: JsonSchema = {
      type: 'object',
      properties: {
        custom: { type: 'string' },
      },
    };
    const created = await workflowService.create({
      name: `workflow_with_custom_schema_${Date.now()}`,
      description: 'Should still use fixed conversational schema',
      type: WorkflowType.conversational,
      schedule: null,
      inputSchema: customSchema,
      createdBy: creatorId,
      memoryDefinitions: [],
    });

    expect(created.inputSchema).toEqual(conversationalWorkflowInputJsonSchema);
  });

  it('allows custom manual schema updates', async () => {
    const manualSchema: JsonSchema = {
      type: 'object',
      properties: {
        amount: { type: 'number' },
      },
      required: ['amount'],
    };
    const created = await workflowService.create({
      name: `manual_workflow_${Date.now()}`,
      description: 'Manual workflow schema test',
      type: WorkflowType.manual,
      inputSchema: manualSchema,
      schedule: null,
      createdBy: creatorId,
      memoryDefinitions: [],
    });

    expect(created.inputSchema).toEqual(manualSchema);

    const updatedManual = await workflowService.updateOne(created.id, {
      inputSchema: {
        type: 'object',
        properties: {
          city: { type: 'string' },
        },
        required: ['city'],
      },
    });
    expect(updatedManual.inputSchema).toEqual({
      type: 'object',
      properties: {
        city: { type: 'string' },
      },
      required: ['city'],
    });
  });

  it('rejects workflow type changes after creation', async () => {
    const scheduled = await workflowService.create({
      name: `scheduled_to_manual_${Date.now()}`,
      description: 'Switch scheduled workflow to manual',
      type: WorkflowType.scheduled,
      schedule: '*/10 * * * * *',
      createdBy: creatorId,
      memoryDefinitions: [],
    });

    expect(scheduled.inputSchema).toEqual(scheduledWorkflowInputJsonSchema);

    await expect(
      workflowService.updateOne(scheduled.id, {
        type: WorkflowType.manual,
        schedule: null,
      } as WorkflowUpdateDto & { type: WorkflowType }),
    ).rejects.toThrow(
      new BadRequestException('Workflow type cannot be changed once created'),
    );
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
