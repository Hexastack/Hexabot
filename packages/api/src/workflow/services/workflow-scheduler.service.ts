/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

import { LoggerService } from '@/logger/logger.service';

import { ScheduledEventWrapper } from '../lib/trigger-event-wrapper';
import { WorkflowType } from '../types';

import { AgenticService } from './agentic.service';
import { WorkflowService } from './workflow.service';

@Injectable()
export class WorkflowSchedulerService implements OnModuleInit {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly agenticService: AgenticService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.registerScheduledWorkflows();
  }

  private async registerScheduledWorkflows(): Promise<void> {
    const workflows = await this.workflowService.findAndPopulate({
      where: { type: WorkflowType.scheduled },
    });

    if (!workflows.length) {
      this.logger.debug('No scheduled workflows to register');

      return;
    }

    for (const workflow of workflows) {
      if (!workflow.schedule) {
        this.logger.warn(
          'Skipping scheduled workflow without a cron expression',
          workflow.id,
        );

        continue;
      }

      if (!workflow.createdBy) {
        this.logger.warn(
          'Skipping scheduled workflow without an initiator',
          workflow.id,
        );

        continue;
      }

      const jobName = `workflow:${workflow.id}`;

      try {
        const existing = this.schedulerRegistry.getCronJob(jobName);
        existing.stop();
        this.schedulerRegistry.deleteCronJob(jobName);
      } catch {
        // No existing job to clean up.
      }

      try {
        const job = new CronJob(workflow.schedule, async () => {
          const triggeredAt = new Date();
          this.logger.log('Triggering scheduled workflow', {
            workflowId: workflow.id,
            schedule: workflow.schedule,
          });

          const event = new ScheduledEventWrapper({
            schedule: workflow.schedule,
            triggeredAt,
          });
          event.setInitiator(workflow.createdBy!);
          await this.agenticService.handleEvent(event);
        });

        this.schedulerRegistry.addCronJob(jobName, job);
        job.start();

        this.logger.debug('Registered scheduled workflow', {
          workflowId: workflow.id,
          schedule: workflow.schedule,
        });
      } catch (err) {
        this.logger.error(
          'Unable to register scheduled workflow cron job',
          err,
          {
            workflowId: workflow.id,
            schedule: workflow.schedule,
          },
        );
      }
    }
  }
}
