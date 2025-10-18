/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity, Index } from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';

@Entity({ name: 'translations' })
export class TranslationOrmEntity extends BaseOrmEntity {
  @Column({ unique: true })
  @Index()
  str!: string;

  @Column({ type: 'simple-json' })
  translations!: Record<string, string>;
}
