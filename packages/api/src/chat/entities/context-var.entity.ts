/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ForbiddenException } from '@nestjs/common';
import { BeforeRemove, Column, Entity, Index } from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';

import { BlockOrmEntity } from './block.entity';

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

  @BeforeRemove()
  protected async ensureNotInUse(): Promise<void> {
    const manager = ContextVarOrmEntity.getEntityManager();

    const pattern = `%\\"context_var\\":\\"${ContextVarOrmEntity.escapeLikePattern(this.name)}\\"%`;
    const blocks = await manager
      .getRepository(BlockOrmEntity)
      .createQueryBuilder('block')
      .select(['block.name'])
      .where('block.capture_vars LIKE :pattern', { pattern })
      .getMany();

    if (!blocks.length) {
      return;
    }

    const blockNames = blocks.map(({ name }) => name).join(', ');
    throw new ForbiddenException(
      `Context var "${this.name}" is associated with the following block(s): ${blockNames} and cannot be deleted.`,
    );
  }

  private static escapeLikePattern(value: string): string {
    return value.replace(/[%_]/g, '\\$&');
  }
}
