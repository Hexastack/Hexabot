/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { contentTypeSchema, contentTypeFullSchema } from '@hexabot-ai/types';
import { JSONSchema7 as JsonSchema } from 'json-schema';
import { Column, Entity, Index, OneToMany } from 'typeorm';

import { AuditLabel } from '@/audit/decorators/audit-label.decorator';
import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import { ContentTypeDto } from '../dto/contentType.dto';

import { ContentOrmEntity } from './content.entity';

@Entity({ name: 'content_types' })
@Index(['name'], { unique: true })
export class ContentTypeOrmEntity extends BaseOrmEntity<ContentTypeDto> {
  plainCls = contentTypeSchema;

  fullCls = contentTypeFullSchema;

  @AuditLabel()
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
