/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DeepPartial, Repository, SelectQueryBuilder } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';
import { LegacyQueryConverter } from '@/utils/generics/legacy-query.converter';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { TFilterQuery } from '@/utils/types/filter.types';

import { NlpSampleState } from '..//types';
import {
  NlpSample,
  NlpSampleFull,
  NlpSampleTransformerDto,
  TNlpSampleDto,
} from '../dto/nlp-sample.dto';
import { NlpValue } from '../dto/nlp-value.dto';
import { NlpSampleEntityOrmEntity } from '../entities/nlp-sample-entity.entity';
import { NlpSampleOrmEntity } from '../entities/nlp-sample.entity';

@Injectable()
export class NlpSampleRepository extends BaseOrmRepository<
  NlpSampleOrmEntity,
  NlpSampleTransformerDto,
  TNlpSampleDto
> {
  private readonly legacyConverter =
    new LegacyQueryConverter<NlpSampleOrmEntity>((sort) =>
      this.normalizeSort(sort as any),
    );

  constructor(
    @InjectRepository(NlpSampleOrmEntity)
    repository: Repository<NlpSampleOrmEntity>,
    @InjectRepository(NlpSampleEntityOrmEntity)
    private readonly nlpSampleEntityRepository: Repository<NlpSampleEntityOrmEntity>,
  ) {
    super(repository, ['language', 'entities'], {
      PlainCls: NlpSample,
      FullCls: NlpSampleFull,
    });
  }

  async findByEntities(
    criterias: {
      filters: TFilterQuery<NlpSampleOrmEntity>;
      values: NlpValue[];
    },
    page?: PageQueryDto<NlpSampleOrmEntity>,
  ): Promise<NlpSample[]> {
    const entities = await this.buildFindByEntitiesQuery(
      criterias,
      page,
    ).getMany();

    return entities.map((entity) =>
      plainToInstance(NlpSample, entity as DeepPartial<NlpSampleOrmEntity>),
    );
  }

  async findByEntitiesAndPopulate(
    criterias: {
      filters: TFilterQuery<NlpSampleOrmEntity>;
      values: NlpValue[];
    },
    page?: PageQueryDto<NlpSampleOrmEntity>,
  ): Promise<NlpSampleFull[]> {
    const entities = await this.buildFindByEntitiesQuery(criterias, page)
      .leftJoinAndSelect('sample.language', 'language')
      .leftJoinAndSelect('sample.entities', 'sampleEntities')
      .leftJoinAndSelect('sampleEntities.entity', 'entity')
      .leftJoinAndSelect('sampleEntities.value', 'value')
      .getMany();

    return entities.map((entity) =>
      plainToInstance(NlpSampleFull, entity as DeepPartial<NlpSampleOrmEntity>),
    );
  }

  async countByEntities(criterias: {
    filters: TFilterQuery<NlpSampleOrmEntity>;
    values: NlpValue[];
  }): Promise<number> {
    const qb = this.buildFindByEntitiesQuery(criterias);

    return await qb.getCount();
  }

  protected override async preDelete(
    entities: NlpSampleOrmEntity[],
    _filter: TFilterQuery<NlpSampleOrmEntity>,
  ): Promise<void> {
    if (!entities.length) {
      return;
    }

    await this.nlpSampleEntityRepository
      .createQueryBuilder()
      .delete()
      .where('sample_id IN (:...ids)', {
        ids: entities.map((sample) => sample.id),
      })
      .execute();
  }

  private buildFindByEntitiesQuery(
    {
      filters,
      values,
    }: {
      filters: TFilterQuery<NlpSampleOrmEntity>;
      values: NlpValue[];
    },
    page?: PageQueryDto<NlpSampleOrmEntity>,
  ): SelectQueryBuilder<NlpSampleOrmEntity> {
    const qb = this.repository.createQueryBuilder('sample');

    const { options, fullyHandled } =
      this.legacyConverter.buildFindOptionsFromLegacyArgs(
        filters ?? {},
        page,
        {},
      );

    if (!fullyHandled) {
      throw new Error(
        'Unsupported legacy filter. Please use TypeORM FindManyOptions instead.',
      );
    }

    if (options.where) {
      qb.setFindOptions({ where: options.where });
    }

    if (options.order) {
      for (const [property, direction] of Object.entries(options.order)) {
        qb.addOrderBy(
          `sample.${property as keyof NlpSampleOrmEntity}`,
          direction as 'ASC' | 'DESC',
        );
      }
    } else {
      qb.addOrderBy('sample.createdAt', 'DESC');
    }

    if (typeof options.skip === 'number') {
      qb.skip(options.skip);
    } else if (typeof page?.skip === 'number') {
      qb.skip(page.skip);
    }

    if (typeof options.take === 'number') {
      qb.take(options.take);
    } else if (typeof page?.limit === 'number') {
      qb.take(page.limit);
    }

    this.applyValueConstraints(qb, values);

    return qb;
  }

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

  async clearLanguages(languageIds: string[]): Promise<number> {
    if (!languageIds.length) {
      return 0;
    }

    const result = await this.repository
      .createQueryBuilder()
      .update()
      .set({ language: null })
      .where('language_id IN (:...languageIds)', { languageIds })
      .execute();

    return result.affected ?? 0;
  }
}
