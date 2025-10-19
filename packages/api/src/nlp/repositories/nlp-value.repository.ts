/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';
import { LegacyQueryConverter } from '@/utils/generics/legacy-query.converter';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { TFilterQuery } from '@/utils/types/filter.types';
import { Format } from '@/utils/types/format.types';

import { NlpSampleState } from '..//types';
import {
  NlpValue,
  NlpValueDto,
  NlpValueFull,
  NlpValueFullWithCount,
  NlpValueTransformerDto,
  NlpValueWithCount,
  TNlpValueCount,
} from '../dto/nlp-value.dto';
import { NlpValueOrmEntity } from '../entities/nlp-value.entity';

@Injectable()
export class NlpValueRepository extends BaseOrmRepository<
  NlpValueOrmEntity,
  NlpValueTransformerDto,
  NlpValueDto
> {
  private readonly legacyConverter =
    new LegacyQueryConverter<NlpValueOrmEntity>((sort) =>
      this.normalizeSort(sort as any),
    );

  constructor(
    @InjectRepository(NlpValueOrmEntity)
    repository: Repository<NlpValueOrmEntity>,
  ) {
    super(repository, ['entity'], {
      PlainCls: NlpValue,
      FullCls: NlpValueFull,
    });
  }

  async findWithCount<F extends Format>(
    format: F,
    pageQuery: PageQueryDto<NlpValueOrmEntity>,
    filterQuery: TFilterQuery<NlpValueOrmEntity> = {},
  ): Promise<TNlpValueCount<F>[]> {
    try {
      const results = await this.buildCountQuery(
        format,
        pageQuery,
        filterQuery,
      ).getMany();

      return results.map((entity) => {
        const payload = {
          ...entity,
          nlpSamplesCount: entity.nlpSamplesCount ?? 0,
        };

        const dto =
          format === Format.FULL
            ? plainToInstance(NlpValueFullWithCount, payload)
            : plainToInstance(NlpValueWithCount, payload);

        return dto as TNlpValueCount<F>;
      });
    } catch (error) {
      this.logger.error(`Error in findWithCount: ${error.message}`, error);
      throw error;
    }
  }

  private buildCountQuery(
    format: Format,
    pageQuery: PageQueryDto<NlpValueOrmEntity>,
    filterQuery: TFilterQuery<NlpValueOrmEntity>,
  ): SelectQueryBuilder<NlpValueOrmEntity> {
    const qb = this.repository.createQueryBuilder('value');

    if (format === Format.FULL) {
      qb.leftJoinAndSelect('value.entity', 'entity');
    } else {
      qb.leftJoin('value.entity', 'entity');
    }

    qb.loadRelationCountAndMap(
      'value.nlpSamplesCount',
      'value.sampleEntities',
      'sampleEntity',
      (relationQb) =>
        relationQb
          .leftJoin('sampleEntity.sample', 'sample')
          .where('sample.type = :trainType', {
            trainType: NlpSampleState.train,
          }),
    );

    const { options, fullyHandled } =
      this.legacyConverter.buildFindOptionsFromLegacyArgs(
        filterQuery ?? {},
        pageQuery,
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
      let hasOrder = false;
      for (const [property, direction] of Object.entries(options.order)) {
        qb.addOrderBy(
          `value.${property as keyof NlpValueOrmEntity}`,
          direction as 'ASC' | 'DESC',
        );
        hasOrder = true;
      }
      if (!hasOrder) {
        qb.addOrderBy('value.createdAt', 'DESC');
      }
    } else {
      qb.addOrderBy('value.createdAt', 'DESC');
    }

    if (typeof options.skip === 'number') {
      qb.skip(options.skip);
    } else if (typeof pageQuery?.skip === 'number') {
      qb.skip(pageQuery.skip);
    }

    if (typeof options.take === 'number') {
      qb.take(options.take);
    } else if (typeof pageQuery?.limit === 'number') {
      qb.take(pageQuery.limit);
    }

    return qb;
  }
}
