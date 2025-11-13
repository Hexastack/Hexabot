/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmEntity } from '@hexabot/core/database';
import { Column, Entity, Index, OneToMany } from 'typeorm';

import { LabelOrmEntity } from './label.entity';

@Entity({ name: 'label_groups' })
@Index(['name'], { unique: true })
export class LabelGroupOrmEntity extends BaseOrmEntity {
  @Column()
  name!: string;

  @OneToMany(() => LabelOrmEntity, (label) => label.group)
  labels?: LabelOrmEntity[];
}
