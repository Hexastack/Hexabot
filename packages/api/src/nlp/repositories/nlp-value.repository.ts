/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { FindManyOptions, Repository, SelectQueryBuilder } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';
import { Format } from '@/utils/types/format.types';

import { NlpSampleState } from '..//types';
import {
  NlpValue,
  NlpValueDtoConfig,
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
  NlpValueDtoConfig
> {
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
    options: FindManyOptions<NlpValueOrmEntity> = {},
  ): Promise<TNlpValueCount<F>[]> {
    try {
      const results = await this.buildCountQuery(format, options).getMany();

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
    options: FindManyOptions<NlpValueOrmEntity>,
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

    const findOptions: FindManyOptions<NlpValueOrmEntity> = {};

    if (options.where) {
      findOptions.where = options.where;
    }

    const hasOrder = options.order && Object.keys(options.order).length > 0;

    if (hasOrder) {
      findOptions.order = options.order;
    }

    if (Object.keys(findOptions).length > 0) {
      qb.setFindOptions(findOptions);
    }

    if (!hasOrder) {
      qb.addOrderBy('value.createdAt', 'DESC');
    }

    if (typeof options.skip === 'number') {
      qb.skip(options.skip);
    }

    if (typeof options.take === 'number') {
      qb.take(options.take);
    }

    return qb;
  }
}
