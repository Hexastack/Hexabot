/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToClass } from 'class-transformer';
import {
  Aggregate,
  Document,
  Model,
  PipelineStage,
  ProjectionType,
  Query,
  Types,
} from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { TFilterQuery } from '@/utils/types/filter.types';

import { TNlpSampleDto } from '../dto/nlp-sample.dto';
import { NlpSampleEntity } from '../schemas/nlp-sample-entity.schema';
import {
  NLP_SAMPLE_POPULATE,
  NlpSample,
  NlpSampleDocument,
  NlpSampleFull,
  NlpSamplePopulate,
} from '../schemas/nlp-sample.schema';

import { NlpSampleEntityRepository } from './nlp-sample-entity.repository';

@Injectable()
export class NlpSampleRepository extends BaseRepository<
  NlpSample,
  NlpSamplePopulate,
  NlpSampleFull,
  TNlpSampleDto
> {
  constructor(
    @InjectModel(NlpSample.name) readonly model: Model<NlpSample>,
    @InjectModel(NlpSampleEntity.name)
    readonly sampleEntityModel: Model<NlpSampleEntity>,
    private readonly nlpSampleEntityRepository: NlpSampleEntityRepository,
  ) {
    super(model, NlpSample, NLP_SAMPLE_POPULATE, NlpSampleFull);
  }

  buildFindByEntitiesStages({
    filters,
    entityIds,
    valueIds,
  }: {
    filters: TFilterQuery<NlpSample>;
    entityIds: Types.ObjectId[];
    valueIds: Types.ObjectId[];
  }): PipelineStage[] {
    return [
      // pick link docs whose entity / value matches a pattern
      {
        $match: {
          ...(entityIds.length && { entity: { $in: entityIds } }),
          ...(valueIds.length && { value: { $in: valueIds } }),
        },
      },

      // join to the real sample *and* apply sample-side filters early
      {
        $lookup: {
          from: 'nlpsamples',
          let: { sampleId: '$sample' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$sampleId'] },
                ...(filters?.$and
                  ? {
                      $and: filters.$and?.map((condition) => {
                        if ('language' in condition && condition.language) {
                          return {
                            language: new Types.ObjectId(condition.language),
                          };
                        }
                        return condition;
                      }),
                    }
                  : {}),
              },
            },
          ],
          as: 'sample',
        },
      },
      { $unwind: '$sample' },
    ];
  }

  findByEntitiesAggregation(
    criterias: {
      filters: TFilterQuery<NlpSample>;
      entityIds: Types.ObjectId[];
      valueIds: Types.ObjectId[];
    },
    page?: PageQueryDto<NlpSample>,
    projection?: ProjectionType<NlpSample>,
  ): Aggregate<NlpSampleDocument[]> {
    return this.sampleEntityModel.aggregate<NlpSampleDocument>([
      ...this.buildFindByEntitiesStages(criterias),

      // promote the sample document
      { $replaceRoot: { newRoot: '$sample' } },

      // sort / skip / limit
      ...this.buildPaginationPipelineStages(page),

      // projection
      ...(projection
        ? [
            {
              $project:
                typeof projection === 'string'
                  ? { [projection]: 1 }
                  : projection,
            },
          ]
        : []),
    ]);
  }

  async findByEntities(
    criterias: {
      filters: TFilterQuery<NlpSample>;
      entityIds: Types.ObjectId[];
      valueIds: Types.ObjectId[];
    },
    page?: PageQueryDto<NlpSample>,
    projection?: ProjectionType<NlpSample>,
  ): Promise<NlpSample[]> {
    const aggregation = this.findByEntitiesAggregation(
      criterias,
      page,
      projection,
    );

    const resultSet = await aggregation.exec();
    return resultSet.map((doc) =>
      plainToClass(NlpSample, doc, this.transformOpts),
    );
  }

  async findByEntitiesAndPopulate(
    criterias: {
      filters: TFilterQuery<NlpSample>;
      entityIds: Types.ObjectId[];
      valueIds: Types.ObjectId[];
    },
    page?: PageQueryDto<NlpSample>,
    projection?: ProjectionType<NlpSample>,
  ): Promise<NlpSampleFull[]> {
    const aggregation = this.findByEntitiesAggregation(
      criterias,
      page,
      projection,
    );

    const docs = await aggregation.exec();

    const populatedResultSet = await this.populate(docs);

    return populatedResultSet.map((doc) =>
      plainToClass(NlpSampleFull, doc, this.transformOpts),
    );
  }

  countByEntitiesAggregation(criterias: {
    filters: TFilterQuery<NlpSample>;
    entityIds: Types.ObjectId[];
    valueIds: Types.ObjectId[];
  }): Aggregate<{ count: number }[]> {
    return this.sampleEntityModel.aggregate<{ count: number }>([
      ...this.buildFindByEntitiesStages(criterias),

      // Collapse duplicates: one bucket per unique sample
      { $group: { _id: '$sample._id' } },

      //  Final count
      { $count: 'count' },
    ]);
  }

  async countByEntities(criterias: {
    filters: TFilterQuery<NlpSample>;
    entityIds: Types.ObjectId[];
    valueIds: Types.ObjectId[];
  }): Promise<{ count: number }> {
    const aggregation = this.countByEntitiesAggregation(criterias);

    const [result] = await aggregation.exec();

    return { count: result?.count || 0 };
  }

  /**
   * Deletes NLP sample entities associated with the provided criteria before deleting the sample itself.
   *
   * @param query - The query object used for deletion.
   * @param criteria - Criteria to identify the sample(s) to delete.
   */
  async preDelete(
    _query: Query<
      DeleteResult,
      Document<NlpSample, any, any>,
      unknown,
      NlpSample,
      'deleteOne' | 'deleteMany'
    >,
    criteria: TFilterQuery<NlpSample>,
  ) {
    if (criteria._id) {
      await this.nlpSampleEntityRepository.deleteMany({
        sample: criteria._id,
      });
    } else {
      throw new Error(
        'Attempted to delete a NLP sample using unknown criteria',
      );
    }
  }
}
