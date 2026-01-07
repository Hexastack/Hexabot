/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ModuleRef } from '@nestjs/core';
import { SchedulerRegistry } from '@nestjs/schedule';
import { TestingModule } from '@nestjs/testing';

import { installScheduledWorkflowFixturesTypeOrm } from '@/utils/test/fixtures/workflow';
import { I18nServiceProvider } from '@/utils/test/providers/i18n-service.provider';
import {
  closeTypeOrmConnections,
  getLastTypeOrmDataSource,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';
import { Workflow } from '@/workflow/dto/workflow.dto';
import { WorkflowType } from '@/workflow/types';

import { ScheduledWorkflowContext } from '../contexts/scheduled-workflow.context';
import { ScheduledEventWrapper } from '../lib/trigger-event-wrapper';

import { AgenticService } from './agentic.service';
import { WorkflowSchedulerService } from './workflow-scheduler.service';
import { WorkflowService } from './workflow.service';

describe('WorkflowSchedulerService (TypeORM)', () => {
  let module: TestingModule;
  let schedulerService: WorkflowSchedulerService;
  let workflowService: WorkflowService;
  let schedulerRegistry: SchedulerRegistry;
  let workflow: Workflow;
  let agenticService: AgenticService;

  const flushCronCallbacks = async () =>
    await new Promise<void>((resolve) => setImmediate(resolve));
  const clearCronJobs = () => {
    if (!schedulerRegistry) {
      return;
    }

    schedulerRegistry.getCronJobs().forEach((job, name) => {
      job.stop();
      schedulerRegistry.deleteCronJob(name);
    });
  };
  const reloadScheduledWorkflow = async () => {
    await workflowService.getRepository().deleteMany();
    await installScheduledWorkflowFixturesTypeOrm(getLastTypeOrmDataSource());
    const [scheduled] = await workflowService.find({
      where: { type: WorkflowType.scheduled },
      order: { createdAt: 'DESC' },
    });

    if (!scheduled) {
      throw new Error('Expected scheduled workflow fixtures');
    }

    workflow = scheduled as Workflow;
  };
  const getJobName = () => `workflow:${workflow.id}`;

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [
        WorkflowSchedulerService,
        {
          provide: ModuleRef,
          useValue: {
            resolve: () => new ScheduledWorkflowContext(),
          },
        },
        I18nServiceProvider,
      ],
      typeorm: {
        fixtures: [installScheduledWorkflowFixturesTypeOrm],
      },
    });

    module = testing.module;
    [agenticService, schedulerService, workflowService, schedulerRegistry] =
      await testing.getMocks([
        AgenticService,
        WorkflowSchedulerService,
        WorkflowService,
        SchedulerRegistry,
      ]);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    clearCronJobs();
    jest.spyOn(agenticService, 'handleEvent').mockResolvedValue(undefined);
    await reloadScheduledWorkflow();
  });

  afterAll(async () => {
    clearCronJobs();
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  it('registers cron jobs for scheduled workflows and triggers the agent handler', async () => {
    await schedulerService.onModuleInit();
    const job = schedulerRegistry.getCronJob(getJobName());

    job.fireOnTick();
    await flushCronCallbacks();

    expect(jest.spyOn(agenticService, 'handleEvent')).toHaveBeenCalledTimes(1);

    jest
      .spyOn(agenticService, 'handleEvent')
      .mockImplementation(async (eventArg, workflowArg) => {
        expect(eventArg).toBeInstanceOf(ScheduledEventWrapper);
        expect(eventArg.getContextData()).toEqual(
          expect.objectContaining({
            schedule: workflow.schedule,
            triggered_at: expect.any(Date),
          }),
        );
        expect(eventArg.getInitiator()).toEqual(
          expect.objectContaining({ id: workflow.createdBy }),
        );
        expect(workflowArg?.id).toBe(workflow.id);
      });
  });

  it('replaces an existing cron job when re-registering workflows', async () => {
    await schedulerService.onModuleInit();
    const existingJob = schedulerRegistry.getCronJob(getJobName());
    const stopSpy = jest.spyOn(schedulerRegistry, 'deleteCronJob');

    await schedulerService.onModuleInit();

    const replacementJob = schedulerRegistry.getCronJob(getJobName());

    expect(stopSpy).toHaveBeenCalledTimes(1);
    expect(replacementJob).not.toBe(existingJob);
  });

  it('skips workflows that are missing a schedule', async () => {
    jest.spyOn(agenticService, 'handleEvent');
    await workflowService.updateOne(workflow.id, { schedule: null });

    await schedulerService.onModuleInit();

    expect(schedulerRegistry.getCronJobs().size).toBe(0);
    expect(agenticService.handleEvent).not.toHaveBeenCalled();
  });

  it('skips workflows that lack an initiator', async () => {
    await workflowService.updateOne(workflow.id, {
      createdBy: null as unknown as string,
    });

    await schedulerService.onModuleInit();

    expect(schedulerRegistry.getCronJobs().size).toBe(0);
  });
});
