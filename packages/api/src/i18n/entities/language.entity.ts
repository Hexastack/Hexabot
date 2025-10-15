/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity, Index } from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';

@Entity({ name: 'languages' })
export class Language extends BaseOrmEntity {
  @Column({ unique: true })
  @Index()
  title!: string;

  @Column({ unique: true })
  @Index()
  code!: string;

  @Column({ default: false })
  isDefault!: boolean;

  @Column({ default: false })
  isRTL!: boolean;
}
