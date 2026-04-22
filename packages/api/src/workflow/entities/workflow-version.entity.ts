/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createHash } from 'crypto';

import {
  Column,
  Entity,
  Index,
  InsertEvent,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { EnumColumn } from '@/database/decorators/enum-column.decorator';
import {
  OnAfterInsert,
  OnBeforeInsert,
} from '@/database/decorators/orm-event-hooks.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { UserOrmEntity } from '@/user/entities/user.entity';
import { AsRelation } from '@/utils';

import {
  workflowVersionFullSchema,
  workflowVersionSchema,
  WorkflowVersionDto,
} from '../dto/workflow-version.dto';
import { WorkflowVersionAction } from '../types';

import { WorkflowOrmEntity } from './workflow.entity';

@Entity({ name: 'workflow_versions' })
@Index(['workflow', 'version'], { unique: true })
export class WorkflowVersionOrmEntity extends BaseOrmEntity<WorkflowVersionDto> {
  plainCls = workflowVersionSchema;

  fullCls = workflowVersionFullSchema;

  /** Workflow that owns this version snapshot. */
  @ManyToOne(() => WorkflowOrmEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workflow_id' })
  @AsRelation()
  workflow!: WorkflowOrmEntity;

  /** Identifier of the linked workflow (for lightweight DTO projection). */
  @RelationId((version: WorkflowVersionOrmEntity) => version.workflow)
  private readonly workflowId!: string;

  /** Monotonic version number per workflow. */
  @Column({ type: 'int' })
  version!: number;

  /** Serialized YAML workflow definition snapshot. */
  @Column({ name: 'definition_yml', type: 'text' })
  definitionYml!: string;

  /** SHA-256 checksum of the YAML snapshot. */
  @Column({ type: 'varchar', length: 64 })
  checksum!: string;

  /** Optional message describing the version. */
  @Column({ type: 'varchar', length: 200, nullable: true })
  message?: string | null;

  /** Parent version used for restore lineage. */
  @ManyToOne(() => WorkflowVersionOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_version_id' })
  @AsRelation()
  parentVersion?: WorkflowVersionOrmEntity | null;

  /** Identifier of the parent version (for lightweight DTO projection). */
  @RelationId((version: WorkflowVersionOrmEntity) => version.parentVersion)
  private readonly parentVersionId?: string | null;

  /** Version action label (create, update, restore, import). */
  @EnumColumn({ enum: WorkflowVersionAction, nullable: true })
  action?: WorkflowVersionAction | null;

  /** User who created the version snapshot. */
  @ManyToOne(() => UserOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'created_by_id' })
  @AsRelation()
  createdBy?: UserOrmEntity | null;

  /** Identifier of the creator (for lightweight DTO projection). */
  @RelationId((version: WorkflowVersionOrmEntity) => version.createdBy)
  private readonly createdById?: string | null;

  /**
   * Compute a SHA-256 checksum for the workflow definition.
   * @param definitionYml Workflow definition in YAML format.
   * @returns Hex-encoded checksum.
   */
  public static computeChecksum(definitionYml: string): string {
    return createHash('sha256').update(definitionYml).digest('hex');
  }

  @OnBeforeInsert()
  protected setChecksum(): void {
    this.checksum = WorkflowVersionOrmEntity.computeChecksum(
      this.definitionYml,
    );
  }

  @OnAfterInsert()
  protected async updateWorkflowVersions(
    event: InsertEvent<WorkflowVersionOrmEntity>,
  ): Promise<void> {
    if (!this.action) {
      return;
    }

    const workflowId =
      typeof this.workflow === 'string' ? this.workflow : this.workflow?.id;
    if (!workflowId) {
      return;
    }

    const workflowRepository = event.manager.getRepository(WorkflowOrmEntity);
    const workflow = await workflowRepository.findOne({
      where: { id: workflowId },
    });

    if (!workflow) {
      return;
    }

    workflow.currentVersion = event.manager.create(WorkflowVersionOrmEntity, {
      id: this.id,
    });
    await workflowRepository.save(workflow);
  }
}
