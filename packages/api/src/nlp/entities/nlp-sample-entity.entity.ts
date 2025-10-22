/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';

import { NlpEntityOrmEntity } from './nlp-entity.entity';
import { NlpSampleOrmEntity } from './nlp-sample.entity';
import { NlpValueOrmEntity } from './nlp-value.entity';

@Entity({ name: 'nlp_sample_entities' })
@Index(['sample', 'entity', 'value'])
export class NlpSampleEntityOrmEntity extends BaseOrmEntity {
  @Column({ type: 'integer', nullable: true })
  start?: number | null;

  @Column({ type: 'integer', nullable: true })
  end?: number | null;

  @ManyToOne(() => NlpEntityOrmEntity, (entity) => entity.sampleEntities, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'entity_id' })
  entity!: NlpEntityOrmEntity;

  @Column({ name: 'entity_id' })
  @RelationId((sampleEntity: NlpSampleEntityOrmEntity) => sampleEntity.entity)
  entityId!: string;

  @ManyToOne(() => NlpValueOrmEntity, (value) => value.sampleEntities, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'value_id' })
  value!: NlpValueOrmEntity;

  @Column({ name: 'value_id' })
  @RelationId((sampleEntity: NlpSampleEntityOrmEntity) => sampleEntity.value)
  valueId!: string;

  @ManyToOne(() => NlpSampleOrmEntity, (sample) => sample.entities, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sample_id' })
  sample!: NlpSampleOrmEntity;

  @Column({ name: 'sample_id' })
  @RelationId((sampleEntity: NlpSampleEntityOrmEntity) => sampleEntity.sample)
  sampleId!: string;
}
