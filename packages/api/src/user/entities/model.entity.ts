/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createRequire } from 'node:module';

import { modelSchema, modelFullSchema } from '@hexabot-ai/types';
import { Column, Entity, Index, OneToMany } from 'typeorm';

import { AuditLabel } from '@/audit/decorators/audit-label.decorator';
import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import { ModelDto } from '../dto/model.dto';
import { TRelation } from '../types/index.type';

import type { PermissionOrmEntity } from './permission.entity';

const requireEntity = createRequire(__filename);

@Entity({ name: 'models' })
@Index(['name'], { unique: true })
@Index(['identity'], { unique: true })
export class ModelOrmEntity extends BaseOrmEntity<ModelDto> {
  plainCls = modelSchema;

  fullCls = modelFullSchema;

  @AuditLabel()
  @Column()
  name!: string;

  @Column()
  identity!: string;

  @JsonColumn({ default: '{}' })
  attributes: Record<string, unknown>;

  @Column({ type: 'varchar', nullable: true })
  relation?: TRelation;

  @OneToMany(
    () => requireEntity('./permission.entity').PermissionOrmEntity,
    (permission: PermissionOrmEntity) => permission.model,
    {
      cascade: ['remove'],
    },
  )
  permissions?: PermissionOrmEntity[];
}
