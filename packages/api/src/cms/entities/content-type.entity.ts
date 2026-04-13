/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JSONSchema7 as JsonSchema } from 'json-schema';
import { Column, Entity, Index, OneToMany } from 'typeorm';

import { EntityDto } from '@/database/decorators/dto-transforms.decorator';
import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import {
  ContentType,
  ContentTypeDto,
  ContentTypeFull,
} from '../dto/contentType.dto';

import { ContentOrmEntity } from './content.entity';

@Entity({ name: 'content_types' })
@Index(['name'], { unique: true })
@EntityDto<ContentTypeDto>({ plain: ContentType, full: ContentTypeFull })
export class ContentTypeOrmEntity extends BaseOrmEntity<ContentTypeDto> {
  @Column({ unique: true })
  name!: string;

  /** JSON Schema describing the expected structure of stored values. */
  @JsonColumn({ nullable: true })
  schema!: JsonSchema;

  @OneToMany(() => ContentOrmEntity, (content) => content.contentType, {
    cascade: ['remove'],
  })
  contents?: ContentOrmEntity[];
}
