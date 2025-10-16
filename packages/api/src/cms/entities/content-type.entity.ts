/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity, Index, OneToMany } from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';

import { ContentField } from '../dto/contentType.dto';

import { Content } from './content.entity';

@Entity({ name: 'content_types' })
@Index(['name'], { unique: true })
export class ContentType extends BaseOrmEntity {
  @Column({ unique: true })
  name!: string;

  @Column({ type: 'simple-json', nullable: true })
  fields!: ContentField[] | null;

  @OneToMany(() => Content, (content) => content.contentType, {
    cascade: ['remove'],
  })
  contents?: Content[];
}
