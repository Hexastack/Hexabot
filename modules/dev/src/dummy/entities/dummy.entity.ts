/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmEntity, JsonColumn } from '@hexabot/core/database';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'dummy' })
export class DummyOrmEntity extends BaseOrmEntity {
  @Column()
  dummy!: string;

  @JsonColumn({ nullable: true })
  dynamicField?: Record<string, unknown>;
}
