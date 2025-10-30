/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity } from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';

@Entity({ name: 'dummy' })
export class DummyOrmEntity extends BaseOrmEntity {
  @Column()
  dummy!: string;

  @Column({ type: 'jsonb', nullable: true })
  dynamicField?: Record<string, unknown>;
}
