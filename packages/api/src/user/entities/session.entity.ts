/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ISession } from 'connect-typeorm';
import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

@Entity({ name: 'sessions' })
export class SessionOrmEntity implements ISession {
  @PrimaryColumn('varchar', { length: 255 })
  id!: string;

  @Column('text')
  json!: string;

  @Index()
  @Column('bigint')
  expiredAt!: number;

  @DeleteDateColumn({ name: 'destroyed_at' })
  destroyedAt?: Date;
}
