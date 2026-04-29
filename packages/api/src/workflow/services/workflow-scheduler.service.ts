/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { RemoveEvent } from 'typeorm';

import { AppInstance } from '@/app.instance';
import { config } from '@/config';
import { LoggerService } from '@/logger/logger.service';
import { UserService } from '@/user/services/user.service';
import {
  InsertEntityEvent,
  UpdateEntityEvent,
} from '@/utils/types/entity-event.types';

import { WorkflowOrmEntity } from '../entities/workflow.entity';
import { ScheduledEventWrapper } from '../lib/trigger-event-wrapper';
import { WorkflowType } from '../types';

import { AgenticService } from './agentic.service';
import { WorkflowService } from './workflow.service';

@Injectable()
export class WorkflowSchedulerService implements OnModuleInit {
  /**
   * Create the scheduler service with workflow, user, and cron dependencies.
   *
   * @param workflowService - Service used to fetch workflows.
   * @param agenticService - Service used to trigger workflows.
   * @param schedulerRegistry - Registry that stores cron jobs.
   * @param logger - Logger instance for scheduler events.
   * @param userService - Service used to resolve workflow initiators.
   */
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly agenticService: AgenticService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly logger: LoggerService,
    private readonly userService: UserService,
  ) {}

  /**
   * Register scheduled workflows when the module boots.
   */
  async onModuleInit(): Promise<void> {
    if (!AppInstance.isReady() && config.env !== 'test') {
      return;
    }
    await this.registerScheduledWorkflows();
  }

  /**
   * Register a workflow when a creation event is emitted.
   *
   * @param event - Insert event containing the created workflow entity.
   */
  @OnEvent('hook:workflow:postCreate')
  async handleWorkflowCreated(
    event: InsertEntityEvent<WorkflowOrmEntity>,
  ): Promise<void> {
    if (event.entity.id) {
      await this.registerScheduledWorkflow(event.entity.id);
    }
  }

  /**
   * Re-register a workflow when it is updated.
   *
   * @param event - Update event containing the workflow identifier.
   */
  @OnEvent('hook:workflow:postUpdate')
  async handleWorkflowUpdated(
    event: UpdateEntityEvent<WorkflowOrmEntity>,
  ): Promise<void> {
    if (event.entity?.id) {
      await this.registerScheduledWorkflow(event.entity.id);
    }
  }

  /**
   * Unregister a workflow when it is deleted.
   *
   * @param event - Remove event containing the workflow identifier.
   */
  @OnEvent('hook:workflow:postDelete')
  async handleWorkflowDeleted(
    event: RemoveEvent<WorkflowOrmEntity>,
  ): Promise<void> {
    if (event.entity?.id) {
      this.unregisterScheduledWorkflow(event.entity.id);
    }
  }

  /**
   * Register cron jobs for all stored scheduled workflows.
   */
  private async registerScheduledWorkflows(): Promise<void> {
    const workflows = await this.workflowService.find({
      where: { type: WorkflowType.scheduled },
    });

    if (!workflows.length) {
      this.logger.debug('No scheduled workflows to register');

      return;
    }

    for (const workflow of workflows) {
      await this.registerScheduledWorkflow(workflow.id);
    }
  }

  /**
   * Register the cron job for a specific workflow.
   *
   * @param workflowId - Identifier of the workflow to schedule.
   */
  private async registerScheduledWorkflow(workflowId: string): Promise<void> {
    const workflow = await this.workflowService.findOne(workflowId);
    if (!workflow) {
      this.logger.warn('Skipping scheduled workflow without an identifier');

      return;
    }

    const jobName = this.getJobName(workflow.id);
    this.removeCronJob(jobName);

    if (workflow.type !== WorkflowType.scheduled) {
      return;
    }

    if (!workflow.schedule) {
      this.logger.warn(
        'Skipping scheduled workflow without a cron expression',
        workflow.id,
      );

      return;
    }

    const initiatorId = workflow.createdBy;

    if (!initiatorId) {
      this.logger.warn(
        'Skipping scheduled workflow without an initiator',
        workflow.id,
      );

      return;
    }

    const initiator = await this.userService.findOne(initiatorId);

    if (!initiator) {
      this.logger.warn(
        'Skipping scheduled workflow without an initiator',
        workflow.id,
      );

      return;
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
        event.setInitiator(initiator);
        event.setWorkflowId(workflow.id);
        await this.agenticService.handleEvent(event);
      });

      this.schedulerRegistry.addCronJob(jobName, job);
      job.start();

      this.logger.debug('Registered scheduled workflow', {
        workflowId: workflow.id,
        schedule: workflow.schedule,
      });
    } catch (err) {
      this.logger.error('Unable to register scheduled workflow cron job', err, {
        workflowId: workflow.id,
        schedule: workflow.schedule,
      });
    }
  }

  /**
   * Unregister the cron job for the specified workflow id.
   *
   * @param workflowId - Identifier of the workflow to unschedule.
   */
  private unregisterScheduledWorkflow(workflowId: string): void {
    const jobName = this.getJobName(workflowId);

    if (this.removeCronJob(jobName)) {
      this.logger.debug('Unregistered scheduled workflow', {
        workflowId,
      });
    }
  }

  /**
   * Build the cron job name for a workflow.
   *
   * @param workflowId - Identifier of the workflow.
   * @returns The cron job name used in the scheduler registry.
   */
  private getJobName(workflowId: string): string {
    return `workflow:${workflowId}`;
  }

  /**
   * Stop and delete a cron job if it exists.
   *
   * @param jobName - Name of the cron job to remove.
   * @returns True when a job was found and removed.
   */
  private removeCronJob(jobName: string): boolean {
    try {
      const existing = this.schedulerRegistry.getCronJob(jobName);
      existing.stop();
      this.schedulerRegistry.deleteCronJob(jobName);

      return true;
    } catch {
      return false;
    }
  }
}
