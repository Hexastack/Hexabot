/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Workflow as AgenticWorkflow } from '@hexabot-ai/agentic';
import { CronJob } from 'cron';
import {
  AfterInsert,
  BeforeRemove,
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { EnumColumn } from '@/database/decorators/enum-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { UserOrmEntity } from '@/user/entities/user.entity';
import { AsRelation } from '@/utils';

import {
  Workflow,
  WorkflowFull,
  WorkflowTransformerDto,
} from '../dto/workflow.dto';
import { DirectionType, WorkflowType, WorkflowVersionAction } from '../types';

import { MemoryDefinitionOrmEntity } from './memory-definition.entity';
import { WorkflowVersionOrmEntity } from './workflow-version.entity';

@Entity({ name: 'workflows' })
@Index(['name'], { unique: true })
export class WorkflowOrmEntity extends BaseOrmEntity<WorkflowTransformerDto> {
  plainCls = Workflow;

  fullCls = WorkflowFull;

  private static readonly BLANK_DEFINITION_YML =
    AgenticWorkflow.stringifyDefinition({
      tasks: {},
      flow: [],
      outputs: {},
    });

  /** Human-readable workflow name, unique per version. */
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  /** Optional description to explain the workflow's purpose. */
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  /** Workflow trigger type (conversational, manual, scheduled). */
  @EnumColumn({
    enum: WorkflowType,
    default: WorkflowType.conversational,
  })
  type!: WorkflowType;

  /** Cron expression used when the workflow is scheduled. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  schedule?: string | null;

  /** Indicates if the workflow is built-in and protected from deletion. */
  @Column({ default: false })
  builtin!: boolean;

  /** Memory definitions available for this workflow. */
  @ManyToMany(() => MemoryDefinitionOrmEntity, {
    cascade: false,
  })
  @JoinTable({
    name: 'workflow_memory_definitions',
    joinColumn: { name: 'workflow_id' },
    inverseJoinColumn: { name: 'memory_definition_id' },
  })
  @AsRelation({ allowArray: true })
  memoryDefinitions: MemoryDefinitionOrmEntity[];

  /** Identifiers of the related memory definitions. */
  @RelationId((workflow: WorkflowOrmEntity) => workflow.memoryDefinitions)
  private readonly memoryDefinitionIds: string[];

  /** User who created the workflow definition. */
  @ManyToOne(() => UserOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'created_by_id' })
  @AsRelation()
  createdBy?: UserOrmEntity | null;

  /** Identifier of the creator (for lightweight DTO projection). */
  @RelationId((workflow: WorkflowOrmEntity) => workflow.createdBy)
  private readonly createdById?: string | null;

  /** Active workflow definition snapshot. */
  @ManyToOne(() => WorkflowVersionOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'current_version_id' })
  @AsRelation()
  currentVersion?: WorkflowVersionOrmEntity | null;

  /** Identifier of the active version (for lightweight DTO projection). */
  @RelationId((workflow: WorkflowOrmEntity) => workflow.currentVersion)
  private readonly currentVersionId?: string | null;

  /** Published workflow definition snapshot (null means draft). */
  @ManyToOne(() => WorkflowVersionOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'published_version_id' })
  @AsRelation()
  publishedVersion?: WorkflowVersionOrmEntity | null;

  /** Identifier of the published version (for lightweight DTO projection). */
  @RelationId((workflow: WorkflowOrmEntity) => workflow.publishedVersion)
  private readonly publishedVersionId?: string | null;

  @Column({
    type: 'decimal',
    default: 0,
  })
  x!: number;

  @Column({
    type: 'decimal',
    default: 0,
  })
  y!: number;

  @Column({
    type: 'decimal',
    default: 1,
  })
  zoom!: number;

  @EnumColumn({ enum: DirectionType, default: DirectionType.HORIZONTAL })
  direction!: DirectionType;

  @AfterInsert()
  protected async createBlankDefinitionVersion(): Promise<void> {
    if (this.currentVersion || this.currentVersionId) {
      return;
    }

    const manager = WorkflowOrmEntity.getEntityManager();
    const createdById =
      typeof this.createdBy === 'string' ? this.createdBy : this.createdBy?.id;
    const version = manager.create(WorkflowVersionOrmEntity, {
      workflow: { id: this.id },
      version: 0,
      definitionYml: WorkflowOrmEntity.BLANK_DEFINITION_YML,
      action: WorkflowVersionAction.create,
      createdBy: createdById ? { id: createdById } : null,
      parentVersion: null,
      message: null,
    });

    await manager.save(WorkflowVersionOrmEntity, version);
  }

  @BeforeRemove()
  protected preventBuiltinRemoval(): void {
    if (this.builtin) {
      throw new Error('Cannot delete builtin workflow');
    }
  }

  get runAfterMs() {
    if (this.type === 'scheduled' && this.schedule) {
      try {
        const job = new CronJob(this.schedule, () => {});
        const nextDate = job.nextDate();

        return nextDate.toMillis() - Date.now();
      } catch {
        return -1;
      }
    }

    return 0;
  }
}
