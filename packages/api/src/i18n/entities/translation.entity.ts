/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity, Index } from 'typeorm';

import { EntityDto } from '@/database/decorators/dto-transforms.decorator';
import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import { Translation, TranslationDto } from '../dto/translation.dto';

@Entity({ name: 'translations' })
@EntityDto<TranslationDto>({ plain: Translation, full: Translation })
export class TranslationOrmEntity extends BaseOrmEntity<TranslationDto> {
  @Column({ unique: true })
  @Index()
  str!: string;

  @JsonColumn()
  translations!: Record<string, string>;
}
