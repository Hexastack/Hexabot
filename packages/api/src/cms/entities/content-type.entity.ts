/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ForbiddenException } from '@nestjs/common';
import { BeforeRemove, Column, Entity, Index, OneToMany } from 'typeorm';

import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import { ContentField } from '../dto/contentType.dto';

import { ContentOrmEntity } from './content.entity';

@Entity({ name: 'content_types' })
@Index(['name'], { unique: true })
export class ContentTypeOrmEntity extends BaseOrmEntity {
  @Column({ unique: true })
  name!: string;

  @JsonColumn({ nullable: true })
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
    const databaseType = manager.connection.options.type;
    const blockQuery = manager
      .createQueryBuilder()
      .select('1')
      .from('blocks', 'block');

    if (databaseType === 'sqlite' || databaseType === 'better-sqlite3') {
      blockQuery.where(
        `json_extract(block.options, '$.content.entity') = :contentTypeId`,
        { contentTypeId: this.id },
      );
    } else if (databaseType === 'postgres') {
      blockQuery.where(
        `(block.options -> 'content' ->> 'entity') = :contentTypeId`,
        { contentTypeId: this.id },
      );
    } else {
      throw new Error(
        `Unsupported database type for content type deletion safeguard: ${databaseType}`,
      );
    }

    const associatedBlock = await blockQuery.limit(1).getRawOne();

    if (associatedBlock) {
      throw new ForbiddenException('Content type have blocks associated to it');
    }
  }
}
