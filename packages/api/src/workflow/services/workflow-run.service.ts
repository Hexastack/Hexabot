/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowSnapshot } from '@hexabot-ai/agentic';
import { Injectable } from '@nestjs/common';

import { BaseOrmService } from '@/utils/generics/base-orm.service';

import {
  WorkflowRun,
  WorkflowRunDtoConfig,
  WorkflowRunFull,
  WorkflowRunTransformerDto,
} from '../dto/workflow-run.dto';
import { WorkflowRunOrmEntity } from '../entities/workflow-run.entity';
import { WorkflowRunRepository } from '../repositories/workflow-run.repository';

type StateUpdate = {
  snapshot?: WorkflowSnapshot | null;
  memory?: Record<string, unknown> | null;
  context?: Record<string, unknown> | null;
};

@Injectable()
export class WorkflowRunService extends BaseOrmService<
  WorkflowRunOrmEntity,
  WorkflowRunTransformerDto,
  WorkflowRunDtoConfig,
  WorkflowRunRepository
> {
  /**
   * Creates the service with the underlying repository injected.
   *
   * @param repository - ORM repository used to persist workflow run entities.
   */
  constructor(readonly repository: WorkflowRunRepository) {
    super(repository);
  }

  /**
   * Mark a run as running and persist optional execution state.
   *
   * @param runId - Identifier of the run to update.
   * @param payload - State changes such as snapshot, memory, context, or resume data.
   * @returns Updated workflow run marked as `running`.
   */
  async markRunning(
    runId: string,
    payload: StateUpdate & { lastResumeData?: unknown },
  ): Promise<WorkflowRun> {
    return await this.updateOne(runId, {
      status: 'running',
      ...payload,
    });
  }

  /**
   * Mark a run as suspended with the corresponding reason and state.
   *
   * @param runId - Identifier of the run to update.
   * @param payload - Suspension metadata (step, reason, data) plus optional state updates.
   * @returns Updated workflow run marked as `suspended`.
   */
  async markSuspended(
    runId: string,
    payload: {
      stepId?: string | null;
      reason?: string | null;
      data?: unknown;
      lastResumeData?: unknown;
    } & StateUpdate,
  ): Promise<WorkflowRun> {
    const { stepId, reason, data, lastResumeData, ...state } = payload;

    return await this.updateOne(runId, {
      status: 'suspended',
      suspendedStep: stepId ?? null,
      suspensionReason: reason ?? null,
      suspensionData: data,
      lastResumeData,
      suspendedAt: new Date(),
      ...state,
    });
  }

  /**
   * Mark a run as finished and store final state/output.
   *
   * @param runId - Identifier of the run to update.
   * @param payload - Final state changes and optional output payload.
   * @returns Updated workflow run marked as `finished`.
   */
  async markFinished(
    runId: string,
    payload: StateUpdate & { output?: Record<string, unknown> | null },
  ): Promise<WorkflowRun> {
    return await this.updateOne(runId, {
      status: 'finished',
      finishedAt: new Date(),
      ...payload,
    });
  }

  /**
   * Mark a run as failed and persist the failure reason and state.
   *
   * @param runId - Identifier of the run to update.
   * @param payload - Optional error message and state changes.
   * @returns Updated workflow run marked as `failed`.
   */
  async markFailed(
    runId: string,
    payload: StateUpdate & { error?: string | null },
  ): Promise<WorkflowRun> {
    return await this.updateOne(runId, {
      status: 'failed',
      failedAt: new Date(),
      ...payload,
    });
  }

  /**
   * Find the latest suspended run for a subscriber.
   *
   * @param subscriberId - Identifier of the subscriber whose suspended run should be fetched.
   * @returns The most recently suspended run populated with relations, or `null` when none exists.
   */
  async findSuspendedRunBySubscriber(
    subscriberId: string,
  ): Promise<WorkflowRunFull | null> {
    return await this.findOneAndPopulate({
      where: { subscriber: { id: subscriberId }, status: 'suspended' },
      order: { suspendedAt: 'DESC', createdAt: 'DESC' },
    });
  }
}
