/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { memoryRecordSchema, memoryRecordFullSchema } from '@hexabot-ai/types';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { ThreadOrmEntity } from '@/chat/entities/thread.entity';
import { DatetimeColumn } from '@/database/decorators/datetime-column.decorator';
import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { UserProfileDto } from '@/user/dto/user-profile.dto';
import { UserProfileOrmEntity } from '@/user/entities/user-profile.entity';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

import { MemoryRecordDto } from '../dto/memory-record.dto';
import type { MemoryValue } from '../types';

import { MemoryDefinitionOrmEntity } from './memory-definition.entity';
import { WorkflowRunOrmEntity } from './workflow-run.entity';
import { WorkflowOrmEntity } from './workflow.entity';

@Entity({ name: 'memory_records' })
@Index(['definition', 'owner', 'workflow', 'thread', 'run'])
@Index(['expiresAt'])
export class MemoryRecordOrmEntity extends BaseOrmEntity<MemoryRecordDto> {
  plainCls = memoryRecordSchema;

  fullCls = memoryRecordFullSchema;

  /** Memory definition that governs the structure and scope of this record. */
  @ManyToOne(() => MemoryDefinitionOrmEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'definition_id' })
  @AsRelation()
  definition!: MemoryDefinitionOrmEntity;

  /** Identifier of the linked memory definition. */
  @RelationId((record: MemoryRecordOrmEntity) => record.definition)
  private readonly definitionId!: string;

  /** Owner of the memory record; null for shared/global memories. */
  @ManyToOne(() => UserProfileOrmEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'owner_id' })
  @AsRelation()
  owner: UserProfileOrmEntity<UserProfileDto>;

  /** Identifier of the owner profile. */
  @RelationId((record: MemoryRecordOrmEntity) => record.owner)
  private readonly ownerId?: string | null;

  /** Workflow to which this record belongs when scoped to workflow/run. */
  @ManyToOne(() => WorkflowOrmEntity, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workflow_id' })
  @AsRelation()
  workflow?: WorkflowOrmEntity | null;

  /** Identifier of the related workflow. */
  @RelationId((record: MemoryRecordOrmEntity) => record.workflow)
  private readonly workflowId?: string | null;

  /** Conversation thread for thread-scoped memory records. */
  @ManyToOne(() => ThreadOrmEntity, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'thread_id' })
  @AsRelation()
  thread?: ThreadOrmEntity | null;

  /** Identifier of the related conversation thread. */
  @RelationId((record: MemoryRecordOrmEntity) => record.thread)
  private readonly threadId?: string | null;

  /** Specific workflow run for run-scoped memory records. */
  @ManyToOne(() => WorkflowRunOrmEntity, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'run_id' })
  @AsRelation()
  run?: WorkflowRunOrmEntity | null;

  /** Identifier of the related workflow run. */
  @RelationId((record: MemoryRecordOrmEntity) => record.run)
  private readonly runId?: string | null;

  /** Stored JSON payload adhering to the associated memory schema. */
  @JsonColumn()
  value!: MemoryValue;

  /** TTL in seconds applied to this record; defaults to the definition's TTL. */
  @Column({ name: 'ttl_seconds', type: 'int', nullable: true })
  ttlSeconds?: number | null;

  /** Timestamp when this memory expires and becomes eligible for cleanup. */
  @DatetimeColumn({ name: 'expires_at', nullable: true })
  expiresAt?: Date | null;
}
