/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowRunStatus, WorkflowSnapshot } from '@hexabot-ai/agentic';
import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';

import { SubscriberOrmEntity } from '@/chat/entities/subscriber.entity';
import { DatetimeColumn } from '@/database/decorators/datetime-column.decorator';
import { EnumColumn } from '@/database/decorators/enum-column.decorator';
import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

import { WorkflowOrmEntity } from './workflow.entity';

export const WORKFLOW_RUN_STATUSES: WorkflowRunStatus[] = [
  'idle',
  'running',
  'suspended',
  'finished',
  'failed',
];

@Entity({ name: 'workflow_runs' })
export class WorkflowRunOrmEntity extends BaseOrmEntity {
  /** Workflow definition executed by this run. */
  @ManyToOne(() => WorkflowOrmEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workflow_id' })
  @AsRelation()
  workflow!: WorkflowOrmEntity;

  /** Identifier of the linked workflow (for internal relations). */
  @RelationId((run: WorkflowRunOrmEntity) => run.workflow)
  private readonly workflowId!: string;

  /** Subscriber linked to the run, if applicable. */
  @ManyToOne(() => SubscriberOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'subscriber_id' })
  @AsRelation()
  subscriber?: SubscriberOrmEntity | null;

  /** Identifier of the linked subscriber (for internal relations). */
  @RelationId((run: WorkflowRunOrmEntity) => run.subscriber)
  private readonly subscriberId?: string | null;

  /** Lifecycle status of the run (idle, running, suspended, finished, failed). */
  @EnumColumn({ enum: WORKFLOW_RUN_STATUSES, default: 'idle' })
  status!: WorkflowRunStatus;

  /** Input payload provided at run start. */
  @JsonColumn({ nullable: true })
  input?: Record<string, unknown> | null;

  /** Output payload produced by the workflow. */
  @JsonColumn({ nullable: true })
  output?: Record<string, unknown> | null;

  /** Working memory accumulated during execution. */
  @JsonColumn({ nullable: true })
  memory?: Record<string, unknown> | null;

  /** Context object shared across workflow steps. */
  @JsonColumn({ nullable: true })
  context?: Record<string, unknown> | null;

  /** Engine snapshot capturing the runner state. */
  @JsonColumn({ nullable: true })
  snapshot?: WorkflowSnapshot | null;

  /** Step identifier where the run was suspended. */
  @Column({
    name: 'suspended_step',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  suspendedStep?: string | null;

  /** Free-text reason explaining why the run was suspended. */
  @Column({
    name: 'suspension_reason',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  suspensionReason?: string | null;

  /** Payload captured when the run was suspended. */
  @JsonColumn({ name: 'suspension_data', nullable: true })
  suspensionData?: unknown;

  /** Payload stored to resume the run after suspension. */
  @JsonColumn({ name: 'last_resume_data', nullable: true })
  lastResumeData?: unknown;

  /** Error message when the run fails. */
  @Column({ name: 'error', type: 'text', nullable: true })
  error?: string | null;

  /** Timestamp when the run entered the suspended state. */
  @DatetimeColumn({ name: 'suspended_at', nullable: true })
  suspendedAt?: Date | null;

  /** Timestamp when the run successfully finished. */
  @DatetimeColumn({ name: 'finished_at', nullable: true })
  finishedAt?: Date | null;

  /** Timestamp when the run failed irrecoverably. */
  @DatetimeColumn({ name: 'failed_at', nullable: true })
  failedAt?: Date | null;

  /** External correlation identifier used to link events. */
  @Column({
    name: 'correlation_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  correlationId?: string | null;

  /** Additional opaque metadata associated with the run. */
  @JsonColumn({ nullable: true })
  metadata?: Record<string, unknown> | null;
}
