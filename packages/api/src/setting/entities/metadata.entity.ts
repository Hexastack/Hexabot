/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { metadataSchema, metadataFullSchema } from '@hexabot-ai/types';
import { Column, Entity, Index } from 'typeorm';

import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import { MetadataDto } from '../dto/metadata.dto';

@Entity({ name: 'metadata' })
@Index(['name'], { unique: true })
export class MetadataOrmEntity extends BaseOrmEntity<MetadataDto> {
  plainCls = metadataSchema;

  fullCls = metadataFullSchema;

  @Column()
  name!: string;

  @JsonColumn()
  value!: any;
}
