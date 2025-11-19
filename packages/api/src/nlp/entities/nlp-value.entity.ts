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
  OneToMany,
  RelationId,
} from 'typeorm';

import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

import { NlpMetadata } from '..//types';
import { NlpValue, NlpValueFull } from '../dto/nlp-value.dto';

import { NlpEntityOrmEntity } from './nlp-entity.entity';
import { NlpSampleEntityOrmEntity } from './nlp-sample-entity.entity';

@Entity({ name: 'nlp_values' })
@Index(['value'], { unique: true })
export class NlpValueOrmEntity extends BaseOrmEntity {
  @Column({ name: 'foreign_id', type: 'text', nullable: true })
  foreignId?: string | null;

  @Column()
  value!: string;

  @JsonColumn({ default: '[]' })
  expressions: string[];

  @JsonColumn({ nullable: true })
  metadata?: NlpMetadata | null;

  @Column({ type: 'text', nullable: true })
  doc?: string | null;

  @Column({ default: false })
  builtin!: boolean;

  @ManyToOne(() => NlpEntityOrmEntity, (entity) => entity.values, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'entity_id' })
  @AsRelation()
  entity!: NlpEntityOrmEntity;

  @RelationId((value: NlpValueOrmEntity) => value.entity)
  private readonly entityId!: string;

  @OneToMany(
    () => NlpSampleEntityOrmEntity,
    (sampleEntity) => sampleEntity.value,
  )
  sampleEntities?: NlpSampleEntityOrmEntity[];

  // Computed relation count, populated via query builders.
  nlpSamplesCount?: number;

  static getValuesFromEntities<
    TEntity extends { values?: TValue[] },
    TValue extends { id: string | number } = NlpValueOrmEntity,
  >(entities: TEntity[]): TValue[] {
    return entities.reduce((acc, entity) => {
      if (Array.isArray(entity.values) && entity.values.length) {
        acc.push(...(entity.values as TValue[]));
      }

      return acc;
    }, [] as TValue[]);
  }

  static getValueMap<T extends NlpValue | NlpValueFull>(values: T[]) {
    return values.reduce(
      (acc, value) => {
        if (value.id !== undefined && value.id !== null) {
          acc[String(value.id)] = value;
        }

        return acc;
      },
      {} as Record<string, T>,
    );
  }
}
