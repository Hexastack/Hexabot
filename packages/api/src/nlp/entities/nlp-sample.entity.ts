/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  RelationId,
} from 'typeorm';

import { EnumColumn } from '@/database/decorators/enum-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { LanguageOrmEntity } from '@/i18n/entities/language.entity';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

import { NlpSampleState } from '..//types';

import { NlpSampleEntityOrmEntity } from './nlp-sample-entity.entity';

@Entity({ name: 'nlp_samples' })
export class NlpSampleOrmEntity extends BaseOrmEntity {
  @Column({ type: 'text' })
  text!: string;

  @Column({ default: false })
  trained!: boolean;

  @EnumColumn({
    enum: NlpSampleState,
    default: NlpSampleState.train,
  })
  type!: NlpSampleState;

  @ManyToOne(() => LanguageOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'language_id' })
  @AsRelation()
  language?: LanguageOrmEntity | null;

  @RelationId((sample: NlpSampleOrmEntity) => sample.language)
  private readonly languageId?: string | null;

  @OneToMany(() => NlpSampleEntityOrmEntity, (entity) => entity.sample)
  entities?: NlpSampleEntityOrmEntity[];
}
