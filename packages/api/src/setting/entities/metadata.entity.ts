/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity, Index } from 'typeorm';

import { EntityDto } from '@/database/decorators/dto-transforms.decorator';
import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import { Metadata, MetadataDto } from '../dto/metadata.dto';

@Entity({ name: 'metadata' })
@Index(['name'], { unique: true })
@EntityDto<MetadataDto>({ plain: Metadata, full: Metadata })
export class MetadataOrmEntity extends BaseOrmEntity<MetadataDto> {
  @Column()
  name!: string;

  @JsonColumn()
  value!: any;
}
