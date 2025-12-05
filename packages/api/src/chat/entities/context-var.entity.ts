/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity, Index } from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';

@Entity({ name: 'context_vars' })
@Index(['label'], { unique: true })
@Index(['name'], { unique: true })
export class ContextVarOrmEntity extends BaseOrmEntity {
  @Column()
  label!: string;

  @Column()
  name!: string;

  @Column({ default: false })
  permanent!: boolean;
}
