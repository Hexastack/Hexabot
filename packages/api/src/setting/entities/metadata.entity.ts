/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmEntity } from '@hexabot/core/database';
import { Column, Entity, Index } from 'typeorm';

import { JsonColumn } from '@/database/decorators/json-column.decorator';

@Entity({ name: 'metadata' })
@Index(['name'], { unique: true })
export class MetadataOrmEntity extends BaseOrmEntity {
  @Column()
  name!: string;

  @JsonColumn()
  value!: any;
}
