/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, PipelineStage, SortOrder, Types } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { TFilterQuery } from '@/utils/types/filter.types';
import { Format } from '@/utils/types/format.types';

import { NlpValueDto } from '../dto/nlp-value.dto';
import {
  NLP_VALUE_POPULATE,
  NlpValue,
  NlpValueFull,
  NlpValueFullWithCount,
  NlpValuePopulate,
  NlpValueWithCount,
  TNlpValueCount,
} from '../schemas/nlp-value.schema';

@Injectable()
export class NlpValueRepository extends BaseRepository<
  NlpValue,
  NlpValuePopulate,
  NlpValueFull,
  NlpValueDto
> {
  constructor(@InjectModel(NlpValue.name) readonly model: Model<NlpValue>) {
    super(model, NlpValue, NLP_VALUE_POPULATE, NlpValueFull);
  }

  private getSortDirection(sortOrder: SortOrder) {
    return typeof sortOrder === 'number'
      ? sortOrder
      : sortOrder.toString().toLowerCase() === 'desc'
        ? -1
        : 1;
  }

  /**
   * Performs an aggregation to retrieve NLP values with their sample counts.
   * * The aggregation:
   * - Applies filter criteria on NLP values.
   * - Optionally applies `$and` conditions, including entity-based filters.
   * - Joins with the `nlpsampleentities` collection to link values to samples.
   * - Joins with the `nlpsamples` collection and restricts results to samples
   *   where `type = "train"`.
   * - Counts the number of associated training samples per NLP value.
   * - Optionally enriches the result with the linked `entity` document if
   *   the format is set to FULL.
   * - Applies pagination (skip, limit) and sorting.
   *
   * @param format - The format can be full or stub
   * @param pageQuery - The pagination parameters
   * @param filterQuery - The filter criteria
   * @returns Aggregated Nlp Value results with sample counts
   */
  private async aggregateWithCount<F extends Format>(
    format: F,
    {
      limit = 10,
      skip = 0,
      sort = ['createdAt', 'desc'],
    }: PageQueryDto<NlpValue>,
    { $and = [], ...rest }: TFilterQuery<NlpValue>,
  ): Promise<TNlpValueCount<F>[]> {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          ...rest,
          ...($and.length
            ? {
                $and: $and.map(({ entity, ...rest }) => ({
                  ...rest,
                  ...(entity
                    ? { entity: new Types.ObjectId(String(entity)) }
                    : {}),
                })),
              }
            : {}),
        },
      },
      {
        $lookup: {
          from: 'nlpsampleentities',
          localField: '_id',
          foreignField: 'value',
          as: '_sampleEntities',
        },
      },
      {
        $unwind: {
          path: '$_sampleEntities',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'nlpsamples',
          localField: '_sampleEntities.sample',
          foreignField: '_id',
          as: '_samples',
        },
      },
      {
        $unwind: {
          path: '$_samples',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$_id',
          _originalDoc: {
            $first: {
              $unsetField: { input: '$$ROOT', field: 'nlpSamplesCount' },
            },
          },
          nlpSamplesCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ifNull: ['$_sampleEntities', false] },
                    { $eq: ['$_samples.type', 'train'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $replaceWith: {
          $mergeObjects: [
            '$_originalDoc',
            { nlpSamplesCount: '$nlpSamplesCount' },
          ],
        },
      },
      ...(format === Format.FULL
        ? [
            {
              $lookup: {
                from: 'nlpentities',
                localField: 'entity',
                foreignField: '_id',
                as: 'entity',
              },
            },
            {
              $unwind: '$entity',
            },
          ]
        : []),
      {
        $sort: {
          [sort[0]]: this.getSortDirection(sort[1]),
          _id: this.getSortDirection(sort[1]),
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ];

    return await this.model.aggregate<TNlpValueCount<F>>(pipeline).exec();
  }

  /**
   * Retrieves NLP values along with their sample counts, applying pagination,
   * filtering, and formatting.
   *
   * @param format - Specifies whether the result should be in FULL or STUB format.
   * @param pageQuery - Pagination parameters (limit, skip, sort).
   * @param filterQuery - Filtering criteria for NLP values and entities.
   * @returns A promise that resolves to a list of NLP value results with their training sample counts,
   *          typed according to the requested format.
   * @throws Logs and rethrows any errors that occur during aggregation or transformation.
   */
  async findWithCount<F extends Format>(
    format: F,
    pageQuery: PageQueryDto<NlpValue>,
    filterQuery: TFilterQuery<NlpValue>,
  ): Promise<TNlpValueCount<F>[]> {
    try {
      const aggregatedResults = await this.aggregateWithCount(
        format,
        pageQuery,
        filterQuery,
      );

      if (format === Format.FULL) {
        return plainToInstance(NlpValueFullWithCount, aggregatedResults, {
          excludePrefixes: ['_'],
        }) as TNlpValueCount<F>[];
      }

      return plainToInstance(NlpValueWithCount, aggregatedResults, {
        excludePrefixes: ['_'],
      }) as TNlpValueCount<F>[];
    } catch (error) {
      this.logger.error(`Error in : ${error.message}`, error);
      throw error;
    }
  }
}
