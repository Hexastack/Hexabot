/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity, Index, InsertEvent, UpdateEvent } from 'typeorm';

import {
  OnBeforeInsert,
  OnBeforeRemove,
  OnBeforeUpdate,
} from '@/database/decorators/orm-event-hooks.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import {
  languageFullSchema,
  LanguageDto,
  languageSchema,
} from '../dto/language.dto';

@Entity({ name: 'languages' })
export class LanguageOrmEntity extends BaseOrmEntity<LanguageDto> {
  plainCls = languageSchema;

  fullCls = languageFullSchema;

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

  @OnBeforeInsert()
  @OnBeforeUpdate()
  protected async ensureSingleDefault(
    event: InsertEvent<LanguageOrmEntity> | UpdateEvent<LanguageOrmEntity>,
  ): Promise<void> {
    if (!this.isDefault) {
      return;
    }

    const queryBuilder = event.manager
      .createQueryBuilder()
      .update(LanguageOrmEntity)
      .set({ isDefault: false })
      .where('isDefault = :isDefault', { isDefault: true });

    if (this.id) {
      queryBuilder.andWhere('id != :id', { id: this.id });
    }

    await queryBuilder.execute();
  }

  @OnBeforeRemove()
  protected preventDefaultRemoval(): void {
    if (this.isDefault) {
      throw new Error('Should not be able to delete default');
    }
  }
}
