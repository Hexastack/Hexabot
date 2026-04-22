/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  WorkflowDefinition,
  Workflow as WorkflowHelper,
  WorkflowSnapshot,
} from '@hexabot-ai/agentic';
import { Workflow, WorkflowRun } from '@hexabot-ai/types';
import { TestingModule } from '@nestjs/testing';

import {
  installUserFixturesTypeOrm,
  userFixtureIds,
} from '@/utils/test/fixtures/user';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { WorkflowRunOrmEntity } from '../entities/workflow-run.entity';
import { WorkflowVersionOrmEntity } from '../entities/workflow-version.entity';
import { WorkflowOrmEntity } from '../entities/workflow.entity';
import { WorkflowRunRepository } from '../repositories/workflow-run.repository';
import { WorkflowRepository } from '../repositories/workflow.repository';
import { WorkflowType, WorkflowVersionAction } from '../types';

import { WorkflowRunService } from './workflow-run.service';
import { WorkflowVersionService } from './workflow-version.service';
import { WorkflowService } from './workflow.service';

describe('WorkflowRunService (TypeORM)', () => {
  let module: TestingModule;
  let workflowService: WorkflowService;
  let workflowRepository: WorkflowRepository;
  let workflowRunService: WorkflowRunService;
  let workflowRunRepository: WorkflowRunRepository;
  let workflowVersionService: WorkflowVersionService;
  let workflow: Workflow;
  let workflowRun: WorkflowRun;
  let workflowVersionId: string | null;
  let counter = 0;
  let creatorId: string;

  const buildWorkflowDefinition = (): WorkflowDefinition => ({
    defs: {
      greet: { kind: 'task', action: 'greet' },
    },
    flow: [{ do: 'greet' }],
    outputs: { result: '=1' },
  });
  const snapshot: WorkflowSnapshot = {
    status: 'running',
    actions: {
      greet: {
        id: 'greet',
        name: 'Greet',
        status: 'running',
      },
    },
  };

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [
        WorkflowService,
        WorkflowRepository,
        WorkflowRunService,
        WorkflowRunRepository,
        WorkflowVersionService,
      ],
      typeorm: {
        entities: [
          WorkflowOrmEntity,
          WorkflowRunOrmEntity,
          WorkflowVersionOrmEntity,
        ],
        fixtures: [installUserFixturesTypeOrm],
      },
    });

    module = testing.module;
    [
      workflowService,
      workflowRepository,
      workflowRunService,
      workflowRunRepository,
      workflowVersionService,
    ] = await testing.getMocks([
      WorkflowService,
      WorkflowRepository,
      WorkflowRunService,
      WorkflowRunRepository,
      WorkflowVersionService,
    ]);
  });

  beforeEach(async () => {
    await workflowRunRepository.deleteMany();
    await workflowRepository.deleteMany();
    creatorId = userFixtureIds.admin;

    workflow = await workflowService.create({
      name: `Run workflow ${++counter}`,
      description: 'Workflow for run tests',
      type: WorkflowType.conversational,
      schedule: null,
      createdBy: creatorId,
    });

    const definition = buildWorkflowDefinition();
    await workflowVersionService.commit({
      workflow: workflow.id,
      definitionYml: WorkflowHelper.stringifyDefinition(definition),
      action: WorkflowVersionAction.create,
      createdBy: creatorId,
    });

    workflow = (await workflowService.findOne(workflow.id))!;
    workflowVersionId = workflow.currentVersion ?? null;

    workflowRun = await workflowRunService.create({
      workflow: workflow.id,
      workflowVersion: workflowVersionId,
      status: 'idle',
      input: { foo: 'bar' },
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

  describe('state transitions', () => {
    it('marks a run as running and forwards state', async () => {
      const payload = {
        snapshot,
        context: { user: 'demo' },
        lastResumeData: { resumed: true },
      };
      const updateSpy = jest.spyOn(workflowRunRepository, 'updateOne');
      const updated = await workflowRunService.markRunning(
        workflowRun.id,
        payload,
      );
      const stored = await workflowRunService.findOne(workflowRun.id);

      expect(updateSpy).toHaveBeenCalledWith(
        workflowRun.id,
        {
          status: 'running',
          ...payload,
        },
        undefined,
      );
      expect(updated.status).toBe('running');
      expect(updated.snapshot).toEqual(payload.snapshot);
      expect(updated.context).toEqual(payload.context);
      expect(updated.lastResumeData).toEqual(payload.lastResumeData);
      expect(stored?.status).toBe('running');
    });

    it('marks a run as suspended with metadata and timestamps', async () => {
      const now = new Date('2024-10-10T10:00:00Z');
      jest.useFakeTimers().setSystemTime(now);
      const payload = {
        stepId: 'greet',
        reason: 'awaiting input',
        data: { question: 'name' },
        stepExecId: 'greet#1',
        suspendIndex: 2,
        suspendKey: 'index:2',
        awaitResults: { 'index:1': { answer: 'Alice' } },
        lastResumeData: { source: 'suspend' },
        snapshot,
        context: { lang: 'en' },
      };
      const updateSpy = jest.spyOn(workflowRunRepository, 'updateOne');
      const updated = await workflowRunService.markSuspended(
        workflowRun.id,
        payload,
      );

      expect(updateSpy).toHaveBeenCalledWith(
        workflowRun.id,
        {
          status: 'suspended',
          suspendedStep: payload.stepId,
          suspensionReason: payload.reason,
          suspensionData: payload.data,
          suspensionStepExecId: payload.stepExecId,
          suspensionIndex: payload.suspendIndex,
          suspensionKey: payload.suspendKey,
          suspensionAwaitResults: payload.awaitResults,
          lastResumeData: payload.lastResumeData,
          suspendedAt: now,
          snapshot,
          context: payload.context,
        },
        undefined,
      );
      expect(updated.status).toBe('suspended');
      expect(updated.suspendedStep).toBe(payload.stepId);
      expect(updated.suspensionReason).toBe(payload.reason);
      expect(updated.suspensionData).toEqual(payload.data);
      expect(updated.suspensionStepExecId).toBe(payload.stepExecId);
      expect(updated.suspensionIndex).toBe(payload.suspendIndex);
      expect(updated.suspensionKey).toBe(payload.suspendKey);
      expect(updated.suspensionAwaitResults).toEqual(payload.awaitResults);
      expect(updated.lastResumeData).toEqual(payload.lastResumeData);
      expect(updated.suspendedAt?.getTime()).toBe(now.getTime());
    });

    it('marks a run as finished with outputs', async () => {
      const now = new Date('2024-11-11T09:00:00Z');
      jest.useFakeTimers().setSystemTime(now);
      const payload = {
        snapshot,
        context: { total: 1 },
        output: { message: 'complete' },
      };
      const updateSpy = jest.spyOn(workflowRunRepository, 'updateOne');
      const updated = await workflowRunService.markFinished(
        workflowRun.id,
        payload,
      );
      const stored = await workflowRunService.findOne(workflowRun.id);

      expect(updateSpy).toHaveBeenCalledWith(
        workflowRun.id,
        {
          status: 'finished',
          finishedAt: now,
          ...payload,
        },
        undefined,
      );
      expect(updated.status).toBe('finished');
      expect(updated.finishedAt?.getTime()).toBe(now.getTime());
      expect(updated.output).toEqual(payload.output);
      expect(stored?.status).toBe('finished');
      expect(stored?.finishedAt?.getTime()).toBe(now.getTime());
    });

    it('marks a run as failed and captures errors', async () => {
      const now = new Date('2024-12-12T08:00:00Z');
      jest.useFakeTimers().setSystemTime(now);
      const payload = {
        snapshot,
        context: { attempt: 1 },
        error: 'Unexpected failure',
      };
      const updateSpy = jest.spyOn(workflowRunRepository, 'updateOne');
      const updated = await workflowRunService.markFailed(
        workflowRun.id,
        payload,
      );
      const stored = await workflowRunService.findOne(workflowRun.id);

      expect(updateSpy).toHaveBeenCalledWith(
        workflowRun.id,
        {
          status: 'failed',
          failedAt: now,
          ...payload,
        },
        undefined,
      );
      expect(updated.status).toBe('failed');
      expect(updated.failedAt?.getTime()).toBe(now.getTime());
      expect(updated.error).toBe(payload.error);
      expect(stored?.status).toBe('failed');
      expect(stored?.failedAt?.getTime()).toBe(now.getTime());
    });
  });

  describe('population helpers', () => {
    it('populates workflow relations on findOneAndPopulate', async () => {
      const populated = await workflowRunService.findOneAndPopulate(
        workflowRun.id,
      );

      expect(populated).not.toBeNull();
      expect(populated!.workflow.id).toBe(workflow.id);
      expect(populated!.workflow.name).toBe(workflow.name);
      expect(populated!.workflowVersion?.id ?? null).toBe(workflowVersionId);
    });

    it('populates workflow relations for bulk queries', async () => {
      const populated = await workflowRunService.findAndPopulate();

      expect(populated).toHaveLength(1);
      expect(populated[0]!.workflow.id).toBe(workflow.id);
      expect(populated[0]!.workflowVersion?.id ?? null).toBe(workflowVersionId);
    });
  });

  describe('findSuspendedRunByTriggeringSubscriber', () => {
    it('delegates to repository with trigger filter and ordering', async () => {
      const mockedRepo = {
        findOneAndPopulate: jest.fn(),
      } as unknown as WorkflowRunRepository;
      const service = new WorkflowRunService(mockedRepo);
      const expectedRun = { id: 'run-123' } as WorkflowRun;

      (mockedRepo.findOneAndPopulate as jest.Mock).mockResolvedValue(
        expectedRun,
      );

      const result = await service.findSuspendedRunByInitiator('sub-1');

      expect(mockedRepo.findOneAndPopulate).toHaveBeenCalledWith({
        where: { triggeredBy: { id: 'sub-1' }, status: 'suspended' },
        order: { suspendedAt: 'DESC', createdAt: 'DESC' },
      });
      expect(result).toBe(expectedRun);
    });

    it('adds workflow filter when a workflow id is provided', async () => {
      const mockedRepo = {
        findOneAndPopulate: jest.fn(),
      } as unknown as WorkflowRunRepository;
      const service = new WorkflowRunService(mockedRepo);
      const expectedRun = { id: 'run-456' } as WorkflowRun;

      (mockedRepo.findOneAndPopulate as jest.Mock).mockResolvedValue(
        expectedRun,
      );

      const result = await service.findSuspendedRunByInitiator(
        'sub-1',
        undefined,
        'workflow-1',
      );

      expect(mockedRepo.findOneAndPopulate).toHaveBeenCalledWith({
        where: {
          triggeredBy: { id: 'sub-1' },
          status: 'suspended',
          workflow: { id: 'workflow-1' },
        },
        order: { suspendedAt: 'DESC', createdAt: 'DESC' },
      });
      expect(result).toBe(expectedRun);
    });

    it('adds thread and workflow filters when both are provided', async () => {
      const mockedRepo = {
        findOneAndPopulate: jest.fn(),
      } as unknown as WorkflowRunRepository;
      const service = new WorkflowRunService(mockedRepo);
      const expectedRun = { id: 'run-789' } as WorkflowRun;

      (mockedRepo.findOneAndPopulate as jest.Mock).mockResolvedValue(
        expectedRun,
      );

      const result = await service.findSuspendedRunByInitiator(
        'sub-1',
        'thread-1',
        'workflow-1',
      );

      expect(mockedRepo.findOneAndPopulate).toHaveBeenCalledWith({
        where: {
          triggeredBy: { id: 'sub-1' },
          thread: { id: 'thread-1' },
          status: 'suspended',
          workflow: { id: 'workflow-1' },
        },
        order: { suspendedAt: 'DESC', createdAt: 'DESC' },
      });
      expect(result).toBe(expectedRun);
    });
  });
});
