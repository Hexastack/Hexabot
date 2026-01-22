/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
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

import { DirectionType, WorkflowType } from '../types';

import { MemoryDefinitionOrmEntity } from './memory-definition.entity';
import { WorkflowVersionOrmEntity } from './workflow-version.entity';

@Entity({ name: 'workflows' })
@Index(['name'], { unique: true })
export class WorkflowOrmEntity extends BaseOrmEntity {
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

  @BeforeRemove()
  protected preventBuiltinRemoval(): void {
    if (this.builtin) {
      throw new Error('Cannot delete builtin workflow');
    }
  }
}
