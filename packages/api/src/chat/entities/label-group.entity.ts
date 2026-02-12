/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity, Index, OneToMany } from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';

import {
  LabelGroup,
  LabelGroupFull,
  LabelGroupTransformerDto,
} from '../dto/label-group.dto';

import { LabelOrmEntity } from './label.entity';

@Entity({ name: 'label_groups' })
@Index(['name'], { unique: true })
export class LabelGroupOrmEntity extends BaseOrmEntity<LabelGroupTransformerDto> {
  plainCls = LabelGroup;

  fullCls = LabelGroupFull;

  @Column()
  name!: string;

  @OneToMany(() => LabelOrmEntity, (label) => label.group)
  labels?: LabelOrmEntity[];
}
