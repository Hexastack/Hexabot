/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmEntity } from '@hexabot/core/database';
import { ForbiddenException } from '@nestjs/common';
import { BeforeRemove, Column, Entity, Index } from 'typeorm';

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
    const databaseType = manager.connection.options.type;
    const blocksQuery = manager
      .getRepository(BlockOrmEntity)
      .createQueryBuilder('block')
      .select(['block.name']);

    if (databaseType === 'sqlite' || databaseType === 'better-sqlite3') {
      blocksQuery.where(
        `EXISTS (
          SELECT 1
          FROM json_each(block.capture_vars) AS capture
          WHERE json_extract(capture.value, '$.context_var') = :contextVar
        )`,
        { contextVar: this.name },
      );
    } else if (databaseType === 'postgres') {
      blocksQuery.where(
        `EXISTS (
          SELECT 1
          FROM json_array_elements(block.capture_vars) AS capture
          WHERE capture ->> 'context_var' = :contextVar
        )`,
        { contextVar: this.name },
      );
    } else {
      throw new Error(
        `Unsupported database type for context var deletion safeguard: ${databaseType}`,
      );
    }

    const blocks = await blocksQuery.getMany();

    if (!blocks.length) {
      return;
    }

    const blockNames = blocks.map(({ name }) => name).join(', ');
    throw new ForbiddenException(
      `Context var "${this.name}" is associated with the following block(s): ${blockNames} and cannot be deleted.`,
    );
  }
}
