/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import {
  DeepPartial,
  FindManyOptions,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import { NlpSampleState } from '..//types';
import {
  NlpSample,
  NlpSampleFull,
  NlpSampleTransformerDto,
  TNlpSampleDto,
} from '../dto/nlp-sample.dto';
import { NlpValue } from '../dto/nlp-value.dto';
import { NlpSampleOrmEntity } from '../entities/nlp-sample.entity';

@Injectable()
export class NlpSampleRepository extends BaseOrmRepository<
  NlpSampleOrmEntity,
  NlpSampleTransformerDto,
  TNlpSampleDto
> {
  /**
   * Initializes the repository with default relations and transformers.
   * @param repository The TypeORM repository for `NlpSampleOrmEntity`.
   */
  constructor(
    @InjectRepository(NlpSampleOrmEntity)
    repository: Repository<NlpSampleOrmEntity>,
  ) {
    super(repository, ['language', 'entities'], {
      PlainCls: NlpSample,
      FullCls: NlpSampleFull,
    });
  }

  /**
   * Finds samples that match the provided entity/value pairs.
   * @param criterias Optional query options and the entity/value constraints to apply.
   * @returns Samples transformed into `NlpSample` instances.
   */
  async findByEntities(criterias: {
    options?: FindManyOptions<NlpSampleOrmEntity>;
    values: NlpValue[];
  }): Promise<NlpSample[]> {
    const entities = await this.buildFindByEntitiesQuery(criterias).getMany();

    return entities.map((entity) => plainToInstance(NlpSample, entity));
  }

  /**
   * Finds samples that match the provided entity/value pairs and loads relations.
   * @param criterias Optional query options and the entity/value constraints to apply.
   * @returns Samples transformed into `NlpSampleFull` instances.
   */
  async findByEntitiesAndPopulate(criterias: {
    options?: FindManyOptions<NlpSampleOrmEntity>;
    values: NlpValue[];
  }): Promise<NlpSampleFull[]> {
    const entities = await this.buildFindByEntitiesQuery(criterias)
      .leftJoinAndSelect('sample.language', 'language')
      .leftJoinAndSelect('sample.entities', 'sampleEntities')
      .leftJoinAndSelect('sampleEntities.entity', 'entity')
      .leftJoinAndSelect('sampleEntities.value', 'value')
      .getMany();

    return entities.map((entity) => plainToInstance(NlpSampleFull, entity));
  }

  /**
   * Counts samples that match the provided entity/value pairs.
   * @param criterias Optional query options and the entity/value constraints to apply.
   * @returns Number of samples that satisfy the constraints.
   */
  async countByEntities(criterias: {
    options?: FindManyOptions<NlpSampleOrmEntity>;
    values: NlpValue[];
  }): Promise<number> {
    const qb = this.buildFindByEntitiesQuery(criterias);

    return await qb.getCount();
  }

  /**
   * Creates the query builder used to retrieve samples filtered by entity/value pairs.
   * @param options Optional TypeORM `FindManyOptions` used to refine filtering.
   * @param values Entity/value constraints to enforce on the query.
   * @returns Configured query builder that applies the provided constraints.
   */
  private buildFindByEntitiesQuery({
    options = {},
    values,
  }: {
    options?: FindManyOptions<NlpSampleOrmEntity>;
    values: NlpValue[];
  }): SelectQueryBuilder<NlpSampleOrmEntity> {
    const qb = this.repository.createQueryBuilder('sample');

    const findOptions: FindManyOptions<NlpSampleOrmEntity> = {};

    const hasWhere = options.where !== undefined;
    const hasOrder =
      options.order !== undefined &&
      Object.keys(options.order as Record<string, unknown>).length > 0;

    if (hasWhere) {
      findOptions.where = options.where;
    }

    if (hasOrder) {
      findOptions.order = options.order;
    }

    if (Object.keys(findOptions).length > 0) {
      qb.setFindOptions(findOptions);
    }

    if (!hasOrder) {
      qb.addOrderBy('sample.createdAt', 'DESC');
    }

    if (typeof options?.skip === 'number') {
      qb.skip(options.skip);
    }

    if (typeof options?.take === 'number') {
      qb.take(options.take);
    }

    this.applyValueConstraints(qb, values);

    return qb;
  }

  /**
   * Constrains the query so that each provided value must be present in the sample.
   * @param qb Query builder to update.
   * @param values Entity/value pairs used in `EXISTS` subqueries.
   */
  private applyValueConstraints(
    qb: SelectQueryBuilder<NlpSampleOrmEntity>,
    values: NlpValue[],
  ): void {
    values.forEach((value, index) => {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM nlp_sample_entities sampleEntity${index} WHERE sampleEntity${index}.sample_id = sample.id AND sampleEntity${index}.entity_id = :entityId${index} AND sampleEntity${index}.value_id = :valueId${index})`,
        {
          [`entityId${index}`]: value.entity,
          [`valueId${index}`]: value.id,
        },
      );
    });
  }

  /**
   * Searches for samples containing keywords and optionally filtered by types.
   * @param keywords Keywords to match within the sample text (case-insensitive).
   * @param types Optional sample states to limit the search scope.
   * @returns Samples transformed into `NlpSample` instances.
   */
  async findContainingKeywords(
    keywords: string[],
    types: NlpSampleState[],
  ): Promise<NlpSample[]> {
    if (!keywords.length) {
      return [];
    }

    const qb = this.repository.createQueryBuilder('sample');

    if (types.length) {
      qb.where('sample.type IN (:...types)', { types });
    }

    const params: Record<string, string> = {};
    const clauses = keywords.map((keyword, index) => {
      const param = `keyword${index}`;
      params[param] = `%${keyword.toLowerCase()}%`;
      return `LOWER(sample.text) LIKE :${param}`;
    });

    if (clauses.length === 1) {
      if (types.length) {
        qb.andWhere(clauses[0], params);
      } else {
        qb.where(clauses[0], params);
      }
    } else {
      const combined = clauses.map((c) => `(${c})`).join(' OR ');
      if (types.length) {
        qb.andWhere(combined, params);
      } else {
        qb.where(combined, params);
      }
    }

    const entities = await qb.getMany();

    return entities.map((entity) =>
      plainToInstance(NlpSample, entity as DeepPartial<NlpSampleOrmEntity>),
    );
  }
}
