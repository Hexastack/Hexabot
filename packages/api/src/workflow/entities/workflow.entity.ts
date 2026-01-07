/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowDefinition } from '@hexabot-ai/agentic';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { EnumColumn } from '@/database/decorators/enum-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { UserOrmEntity } from '@/user/entities/user.entity';
import { AsRelation } from '@/utils';

import { parseWorkflowDefinition } from '../lib/workflow-definition';
import { WorkflowType } from '../types';

@Entity({ name: 'workflows' })
@Index(['name', 'version'], { unique: true })
export class WorkflowOrmEntity extends BaseOrmEntity {
  /** Human-readable workflow name, unique per version. */
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  /** Version label for the workflow definition (e.g. semver or tag). */
  @Column({ type: 'varchar', length: 50 })
  version!: string;

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

  /** Raw YAML workflow definition provided by the user. */
  @Column({ name: 'definition_yaml', type: 'text' })
  definitionYaml!: string;

  /** Structured workflow definition consumed by the agent runtime. */
  get definition(): WorkflowDefinition {
    if (
      this.definitionCache?.yaml === this.definitionYaml &&
      this.definitionCache.definition
    ) {
      return this.definitionCache.definition;
    }

    const parsed = parseWorkflowDefinition(this.definitionYaml);
    this.definitionCache = {
      yaml: this.definitionYaml,
      definition: parsed,
    };

    return parsed;
  }

  private definitionCache?: {
    yaml: string;
    definition: WorkflowDefinition;
  };
}
