/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmEntity, JsonColumn } from '@hexabot/core/database';
import { Column, Entity, Index, OneToMany } from 'typeorm';

import { Lookup, LookupStrategy } from '..//types';
import { NlpEntity, NlpEntityFull } from '../dto/nlp-entity.dto';

import { NlpSampleEntityOrmEntity } from './nlp-sample-entity.entity';
import { NlpValueOrmEntity } from './nlp-value.entity';

@Entity({ name: 'nlp_entities' })
@Index(['name'], { unique: true })
export class NlpEntityOrmEntity extends BaseOrmEntity {
  @Column({ name: 'foreign_id', type: 'text', nullable: true })
  foreignId?: string | null;

  @Column()
  name!: string;

  @JsonColumn()
  lookups: Lookup[] = [LookupStrategy.keywords as Lookup];

  @Column({ type: 'text', nullable: true })
  doc?: string | null;

  @Column({ default: false })
  builtin!: boolean;

  @Column({ type: 'integer', default: 1 })
  weight!: number;

  @OneToMany(() => NlpValueOrmEntity, (value) => value.entity)
  values?: NlpValueOrmEntity[];

  @OneToMany(
    () => NlpSampleEntityOrmEntity,
    (sampleEntity) => sampleEntity.entity,
  )
  sampleEntities?: NlpSampleEntityOrmEntity[];

  static getEntityMap<T extends NlpEntity | NlpEntityFull>(entities: T[]) {
    return entities.reduce(
      (acc, entity) => {
        if (entity.id) {
          acc[entity.id] = entity;
        }

        return acc;
      },
      {} as Record<string, T>,
    );
  }
}
