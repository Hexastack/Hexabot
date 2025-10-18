/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity, Index, OneToMany } from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';

import { ContentField } from '../dto/contentType.dto';

import { ContentOrmEntity } from './content.entity';

@Entity({ name: 'content_types' })
@Index(['name'], { unique: true })
export class ContentTypeOrmEntity extends BaseOrmEntity {
  @Column({ unique: true })
  name!: string;

  @Column({ type: 'simple-json', nullable: true })
  fields!: ContentField[] | null;

  @OneToMany(() => ContentOrmEntity, (content) => content.contentType, {
    cascade: ['remove'],
  })
  contents?: ContentOrmEntity[];
}
