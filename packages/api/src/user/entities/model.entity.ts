/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity, Index, OneToMany } from 'typeorm';

import { EntityDto } from '@/database/decorators/dto-transforms.decorator';
import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import { Model, ModelDto, ModelFull } from '../dto/model.dto';
import { TRelation } from '../types/index.type';

import { PermissionOrmEntity } from './permission.entity';

@Entity({ name: 'models' })
@Index(['name'], { unique: true })
@Index(['identity'], { unique: true })
@EntityDto<ModelDto>({ plain: Model, full: ModelFull })
export class ModelOrmEntity extends BaseOrmEntity<ModelDto> {
  @Column()
  name!: string;

  @Column()
  identity!: string;

  @JsonColumn({ default: '{}' })
  attributes: Record<string, unknown>;

  @Column({ nullable: true })
  relation?: TRelation;

  @OneToMany(() => PermissionOrmEntity, (permission) => permission.model, {
    cascade: ['remove'],
  })
  permissions?: PermissionOrmEntity[];
}
