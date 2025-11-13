/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmEntity } from '@hexabot/core/database';
import {
  BeforeInsert,
  BeforeRemove,
  BeforeUpdate,
  Column,
  Entity,
  Index,
} from 'typeorm';

@Entity({ name: 'languages' })
export class LanguageOrmEntity extends BaseOrmEntity {
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

  @BeforeInsert()
  @BeforeUpdate()
  protected async ensureSingleDefault(): Promise<void> {
    if (!this.isDefault) {
      return;
    }

    const manager = LanguageOrmEntity.getEntityManager();
    const queryBuilder = manager
      .createQueryBuilder()
      .update(LanguageOrmEntity)
      .set({ isDefault: false })
      .where('isDefault = :isDefault', { isDefault: true });

    if (this.id) {
      queryBuilder.andWhere('id != :id', { id: this.id });
    }

    await queryBuilder.execute();
  }

  @BeforeRemove()
  protected preventDefaultRemoval(): void {
    if (this.isDefault) {
      throw new Error('Should not be able to delete default');
    }
  }
}
