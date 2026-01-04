/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

import { LoggerService } from '@/logger/logger.service';
import { userFixtureIds } from '@/utils/test/fixtures/user';
import {
  installScheduledWorkflowFixturesTypeOrm,
  scheduledWorkflowDefinition,
} from '@/utils/test/fixtures/workflow';
import {
  closeTypeOrmConnections,
  getLastTypeOrmDataSource,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';
import { WorkflowOrmEntity } from '@/workflow/entities/workflow.entity';
import { WorkflowRepository } from '@/workflow/repositories/workflow.repository';
import { WorkflowType } from '@/workflow/types';

import { AgenticService } from './agentic.service';
import { WorkflowSchedulerService } from './workflow-scheduler.service';
import { WorkflowService } from './workflow.service';

describe('WorkflowSchedulerService', () => {
  let service: WorkflowSchedulerService;
  let workflowService: WorkflowService;
  let agenticService: jest.Mocked<AgenticService>;
  let schedulerRegistry: jest.Mocked<SchedulerRegistry>;
  let logger: jest.Mocked<LoggerService>;
  let registeredJobs: { name: string; job: CronJob }[];

  beforeEach(async () => {
    registeredJobs = [];
    agenticService = {
      handleEvent: jest.fn(),
    } as unknown as jest.Mocked<AgenticService>;
    schedulerRegistry = {
      getCronJob: jest.fn(() => {
        throw new Error('not found');
      }),
      addCronJob: jest.fn((name, job) => {
        registeredJobs.push({ name, job: job as CronJob });
      }),
      deleteCronJob: jest.fn(),
    } as unknown as jest.Mocked<SchedulerRegistry>;
    logger = {
      debug: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    const { getMocks } = await buildTestingMocks({
      providers: [
        WorkflowSchedulerService,
        WorkflowService,
        WorkflowRepository,
        { provide: AgenticService, useValue: agenticService },
        { provide: SchedulerRegistry, useValue: schedulerRegistry },
        { provide: LoggerService, useValue: logger },
      ],
      typeorm: {
        entities: [WorkflowOrmEntity],
        fixtures: [installScheduledWorkflowFixturesTypeOrm],
      },
    });

    [service, workflowService] = await getMocks([
      WorkflowSchedulerService,
      WorkflowService,
    ]);
  });

  afterEach(async () => {
    registeredJobs.forEach(({ job }) => job.stop());
    jest.clearAllMocks();
    await closeTypeOrmConnections();
  });

  it('logs a debug message when no scheduled workflows exist', async () => {
    const dataSource = getLastTypeOrmDataSource();
    const repository = dataSource.getRepository(WorkflowOrmEntity);
    await repository.clear();

    await service.onModuleInit();

    expect(logger.debug).toHaveBeenCalledWith(
      'No scheduled workflows to register',
    );
    expect(schedulerRegistry.addCronJob).not.toHaveBeenCalled();
  });

  it('skips workflows missing a schedule or initiator', async () => {
    const dataSource = getLastTypeOrmDataSource();
    const repository = dataSource.getRepository(WorkflowOrmEntity);
    await repository.clear();
    await repository.save([
      repository.create({
        name: 'missing-schedule',
        version: '1.0.0',
        type: WorkflowType.scheduled,
        schedule: null,
        createdBy: { id: userFixtureIds.admin },
        definition: scheduledWorkflowDefinition,
      }),
      repository.create({
        name: 'missing-initiator',
        version: '1.0.0',
        type: WorkflowType.scheduled,
        schedule: '*/5 * * * * *',
        createdBy: null,
        definition: scheduledWorkflowDefinition,
      }),
    ]);

    await service.onModuleInit();

    const workflows = await workflowService.findAndPopulate({
      where: { type: WorkflowType.scheduled },
    });
    expect(workflows).toHaveLength(2);
    expect(logger.warn).toHaveBeenCalledWith(
      'Skipping scheduled workflow without a cron expression',
      expect.any(String),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Skipping scheduled workflow without an initiator',
      expect.any(String),
    );
    expect(schedulerRegistry.addCronJob).not.toHaveBeenCalled();
  });

  it('registers cron jobs for scheduled workflows and forwards events to the agentic service', async () => {
    const [workflow] = await workflowService.findAndPopulate({
      where: { type: WorkflowType.scheduled },
    });
    expect(workflow).toBeDefined();
    const jobName = `workflow:${workflow.id}`;
    const existingJob = { stop: jest.fn() } as unknown as CronJob;
    schedulerRegistry.getCronJob.mockReturnValueOnce(existingJob);

    await service.onModuleInit();

    expect(existingJob.stop).toHaveBeenCalled();
    expect(schedulerRegistry.deleteCronJob).toHaveBeenCalledWith(jobName);
    expect(schedulerRegistry.addCronJob).toHaveBeenCalledWith(
      jobName,
      expect.any(CronJob),
    );

    const [{ job }] = registeredJobs;
    expect(job.running).toBe(true);

    const eventHandled = new Promise<void>((resolve) => {
      agenticService.handleEvent.mockImplementationOnce(async () => resolve());
    });
    job.fireOnTick();
    await eventHandled;

    expect(agenticService.handleEvent).toHaveBeenCalledTimes(1);
    const event = agenticService.handleEvent.mock.calls[0][0];
    expect(event.getInitiator()?.id).toEqual(workflow.createdBy?.id);
    expect(event.getContextData()).toEqual(
      expect.objectContaining({
        schedule: workflow.schedule,
      }),
    );
    expect(event.getMetadata().triggered_at).toBeInstanceOf(Date);
    expect(logger.debug).toHaveBeenCalledWith(
      'Registered scheduled workflow',
      expect.objectContaining({
        workflowId: workflow.id,
        schedule: workflow.schedule,
      }),
    );
  });
});
