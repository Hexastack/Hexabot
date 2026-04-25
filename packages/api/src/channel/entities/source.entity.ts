/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { sourceFullSchema, sourceSchema } from '@hexabot-ai/types';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { AuditLabel } from '@/audit/decorators/audit-label.decorator';
import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';
import { WorkflowOrmEntity } from '@/workflow/entities/workflow.entity';

import { SourceDto } from '../dto/source.dto';

@Entity({ name: 'sources' })
@Index(['name'], { unique: true })
@Index(['channel'])
export class SourceOrmEntity extends BaseOrmEntity<SourceDto> {
  plainCls = sourceSchema;

  fullCls = sourceFullSchema;

  @AuditLabel()
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 128 })
  channel!: string;

  @JsonColumn()
  settings!: Record<string, unknown>;

  @Column({ default: true })
  state!: boolean;

  @ManyToOne(() => WorkflowOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'default_workflow_id' })
  @AsRelation()
  defaultWorkflow!: WorkflowOrmEntity | null;

  @RelationId((source: SourceOrmEntity) => source.defaultWorkflow)
  private readonly defaultWorkflowId?: string | null;
}
