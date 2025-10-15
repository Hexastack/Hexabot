/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity, Index } from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';

import { SettingType } from '../types';

@Entity({ name: 'settings' })
@Index(['group', 'label'])
export class Setting extends BaseOrmEntity {
  @Column()
  @Index()
  group!: string;

  @Column({ nullable: true })
  subgroup?: string;

  @Column()
  @Index()
  label!: string;

  @Column({ type: 'varchar' })
  type!: SettingType;

  @Column({ type: 'simple-json', nullable: true })
  value: any;

  @Column({ type: 'simple-json', nullable: true })
  options?: string[];

  @Column({ type: 'simple-json', nullable: true })
  config?: Record<string, any>;

  @Column({ default: 0 })
  weight?: number;

  @Column({ default: false })
  translatable?: boolean;
}
