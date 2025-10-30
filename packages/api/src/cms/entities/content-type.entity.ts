/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ForbiddenException } from '@nestjs/common';
import { BeforeRemove, Column, Entity, Index, OneToMany } from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';

import { ContentField } from '../dto/contentType.dto';

import { ContentOrmEntity } from './content.entity';

@Entity({ name: 'content_types' })
@Index(['name'], { unique: true })
export class ContentTypeOrmEntity extends BaseOrmEntity {
  @Column({ unique: true })
  name!: string;

  @Column({ type: 'jsonb', nullable: true })
  fields!: ContentField[] | null;

  @OneToMany(() => ContentOrmEntity, (content) => content.contentType, {
    cascade: ['remove'],
  })
  contents?: ContentOrmEntity[];

  @BeforeRemove()
  protected async ensureNoAssociatedBlocks(): Promise<void> {
    if (!this.id) {
      return;
    }

    const manager = ContentTypeOrmEntity.getEntityManager();
    const pattern = `%"content":%"entity":"${ContentTypeOrmEntity.escapeLikePattern(
      this.id,
    )}"%`;

    const associatedBlock = await manager
      .createQueryBuilder()
      .select('1')
      .from('blocks', 'block')
      .where('block.options LIKE :pattern', { pattern })
      .limit(1)
      .getRawOne();

    if (associatedBlock) {
      throw new ForbiddenException('Content type have blocks associated to it');
    }
  }

  private static escapeLikePattern(value: string): string {
    return value.replace(/[%_]/g, '\\$&');
  }
}
