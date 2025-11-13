/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmEntity, JsonColumn } from '@hexabot/core/database';
import { ForbiddenException } from '@nestjs/common';
import { BeforeRemove, Column, Entity, Index, OneToMany } from 'typeorm';

import { BlockOrmEntity } from './block.entity';

@Entity({ name: 'categories' })
@Index(['label'], { unique: true })
export class CategoryOrmEntity extends BaseOrmEntity {
  @Column()
  label!: string;

  @Column({ default: false })
  builtin!: boolean;

  @Column({ type: 'integer', default: 100 })
  zoom!: number;

  @JsonColumn()
  offset: [number, number] = [0, 0];

  @OneToMany(() => BlockOrmEntity, (block) => block.category)
  blocks?: BlockOrmEntity[];

  @BeforeRemove()
  async ensureNoBlocksBeforeDelete(): Promise<void> {
    const message = `Category ${this.label} has at least one associated block`;

    if (Array.isArray(this.blocks) && this.blocks.length > 0) {
      throw new ForbiddenException(message);
    }

    const manager = CategoryOrmEntity.getEntityManager();
    const blockCount = await manager.getRepository(BlockOrmEntity).count({
      where: {
        category: {
          id: this.id,
        },
      },
    });

    if (blockCount > 0) {
      throw new ForbiddenException(message);
    }
  }
}
