/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity, Index } from 'typeorm';

import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

@Entity({ name: 'categories' })
@Index(['label'], { unique: true })
export class CategoryOrmEntity extends BaseOrmEntity {
  @Column()
  label!: string;

  @Column({ default: false })
  builtin!: boolean;

  @Column({ type: 'integer', default: 100 })
  zoom!: number;

  @JsonColumn({ default: '[0, 0]' })
  offset: [number, number];
}
