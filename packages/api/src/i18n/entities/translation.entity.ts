/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity, Index } from 'typeorm';

import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import { Translation, TranslationTransformerDto } from '../dto/translation.dto';

@Entity({ name: 'translations' })
export class TranslationOrmEntity extends BaseOrmEntity<TranslationTransformerDto> {
  plainCls = Translation;

  fullCls = Translation;

  @Column({ unique: true })
  @Index()
  str!: string;

  @JsonColumn()
  translations!: Record<string, string>;
}
