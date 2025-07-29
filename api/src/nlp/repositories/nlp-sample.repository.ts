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
  Query,
  Types,
} from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { TFilterQuery, TProjectionType } from '@/utils/types/filter.types';

import { TNlpSampleDto } from '../dto/nlp-sample.dto';
import { NlpSampleEntity } from '../schemas/nlp-sample-entity.schema';
import {
  NLP_SAMPLE_POPULATE,
  NlpSample,
  NlpSampleDocument,
  NlpSampleFull,
  NlpSamplePopulate,
} from '../schemas/nlp-sample.schema';
import { NlpValue } from '../schemas/nlp-value.schema';

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
    private readonly nlpSampleEntityModel: Model<NlpSampleEntity>,
  ) {
    super(model, NlpSample, NLP_SAMPLE_POPULATE, NlpSampleFull);
  }

  /**
   * Normalize the filter query.
   *
   * @param filters - The filters to normalize.
   * @returns The normalized filters.
   */
  private normalizeFilters(
    filters: TFilterQuery<NlpSample>,
  ): TFilterQuery<NlpSample> {
    if (filters?.$and) {
      return {
        ...filters,
        $and: filters.$and.map((condition) => {
          // @todo: think of a better way to handle language to objectId conversion
          // This is a workaround for the fact that language is stored as an ObjectId
          // in the database, but we want to filter by its string representation.
          if ('language' in condition && condition.language) {
            return {
              ...condition,
              language: new Types.ObjectId(condition.language as string),
            };
          }
          return condition;
        }),
      };
    }
    return filters;
  }

  /**
   * Build the aggregation stages that restrict a *nlpSampleEntities* collection
   * to links which:
   * 1. Reference all of the supplied `values`, and
   * 2. Whose document satisfies the optional `filters`.
   *
   * @param criterias               Object with:
   * @param criterias.filters       Extra filters to be applied on *nlpsamples*.
   * @param criterias.entities      Entity documents whose IDs should match `entity`.
   * @param criterias.values        Value documents whose IDs should match `value`.
   * @returns Array of aggregation `PipelineStage`s ready to be concatenated
   *          into a larger pipeline.
   */
  buildFindByEntitiesStages({
    filters,
    values,
  }: {
    filters: TFilterQuery<NlpSample>;
    values: NlpValue[];
  }): PipelineStage[] {
    const requiredPairs = values.map(({ id, entity }) => ({
      entity: new Types.ObjectId(entity),
      value: new Types.ObjectId(id),
    }));

    const normalizedFilters = this.normalizeFilters(filters);

    return [
      {
        $match: {
          ...normalizedFilters,
        },
      },

      // Fetch the entities for each sample
      {
        $lookup: {
          from: 'nlpsampleentities',
          localField: '_id', // nlpsamples._id
          foreignField: 'sample', // nlpsampleentities.sample
          as: 'sampleentities',
          pipeline: [
            {
              $match: {
                $or: requiredPairs,
              },
            },
          ],
        },
      },

      // Filter out empty or less matching
      {
        $match: {
          $expr: {
            $gte: [{ $size: '$sampleentities' }, requiredPairs.length],
          },
        },
      },

      // Collapse each link into an { entity, value } object
      {
        $addFields: {
          entities: {
            $ifNull: [
              {
                $map: {
                  input: '$sampleentities',
                  as: 's',
                  in: { entity: '$$s.entity', value: '$$s.value' },
                },
              },
              [],
            ],
          },
        },
      },

      // Keep only the samples whose `entities` array ⊇ `requiredPairs`
      {
        $match: {
          $expr: {
            $eq: [
              requiredPairs.length, // target size
              {
                $size: {
                  $setIntersection: ['$entities', requiredPairs],
                },
              },
            ],
          },
        },
      },

      //drop helper array if you don’t need it downstream
      { $project: { entities: 0, sampleentities: 0 } },
    ];
  }

  findByEntitiesAggregation(
    criterias: {
      filters: TFilterQuery<NlpSample>;
      values: NlpValue[];
    },
    page?: PageQueryDto<NlpSample>,
    projection?: TProjectionType<NlpSample>,
  ): Aggregate<NlpSampleDocument[]> {
    return this.model.aggregate<NlpSampleDocument>([
      ...this.buildFindByEntitiesStages(criterias),

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
      values: NlpValue[];
    },
    page?: PageQueryDto<NlpSample>,
    projection?: TProjectionType<NlpSample>,
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

  /**
   * Find NLP samples by entities and populate them with their related data.
   *
   * @param criterias - Criteria containing filters and values to match.
   * @param page - Optional pagination parameters.
   * @param projection - Optional projection to limit fields returned.
   * @returns Promise resolving to an array of populated NlpSampleFull objects.
   */
  async findByEntitiesAndPopulate(
    criterias: {
      filters: TFilterQuery<NlpSample>;
      values: NlpValue[];
    },
    page?: PageQueryDto<NlpSample>,
    projection?: TProjectionType<NlpSample>,
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

  /**
   * Build an aggregation pipeline that counts NLP samples satisfying:
   * – the extra `filters`  (passed to `$match` later on), and
   * – All of the supplied `entities` / `values`.
   *
   * @param criterias `{ filters, entities, values }`
   * @returns Un-executed aggregation cursor.
   */
  countByEntitiesAggregation(criterias: {
    filters: TFilterQuery<NlpSample>;
    values: NlpValue[];
  }): Aggregate<{ count: number }[]> {
    return this.model.aggregate<{ count: number }>([
      ...this.buildFindByEntitiesStages(criterias),

      //  Final count
      { $count: 'count' },
    ]);
  }

  /**
   * Returns the count of samples by filters, entities and/or values
   *
   * @param criterias `{ filters, entities, values }`
   * @returns Promise resolving to the count.
   */
  async countByEntities(criterias: {
    filters: TFilterQuery<NlpSample>;
    values: NlpValue[];
  }): Promise<number> {
    const aggregation = this.countByEntitiesAggregation(criterias);

    const [result] = await aggregation.exec();

    return result?.count || 0;
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
      await this.nlpSampleEntityModel.deleteMany({
        sample: criteria._id,
      });
    } else {
      throw new Error(
        'Attempted to delete a NLP sample using unknown criteria',
      );
    }
  }
}
