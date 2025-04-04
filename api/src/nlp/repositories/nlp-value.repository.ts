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
import mongoose, {
  Document,
  Model,
  PipelineStage,
  Query,
  Types,
} from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { TFilterQuery } from '@/utils/types/filter.types';

import { NlpValueDto } from '../dto/nlp-value.dto';
import { NlpEntity, NlpEntityModel } from '../schemas/nlp-entity.schema';
import {
  NLP_VALUE_POPULATE,
  NlpValue,
  NlpValueDocument,
  NlpValueFull,
  NlpValueFullWithCount,
  NlpValuePopulate,
  NlpValueWithCount,
  TNlpValueCountFormat,
} from '../schemas/nlp-value.schema';

import { NlpSampleEntityRepository } from './nlp-sample-entity.repository';

@Injectable()
export class NlpValueRepository extends BaseRepository<
  NlpValue,
  NlpValuePopulate,
  NlpValueFull,
  NlpValueDto
> {
  constructor(
    @InjectModel(NlpValue.name) readonly model: Model<NlpValue>,
    private readonly nlpSampleEntityRepository: NlpSampleEntityRepository,
  ) {
    super(model, NlpValue, NLP_VALUE_POPULATE, NlpValueFull);
  }

  /**
   * Emits an event after a new NLP value is created, bypassing built-in values.
   *
   * @param created - The newly created NLP value document.
   */
  async postCreate(created: NlpValueDocument): Promise<void> {
    if (!created.builtin) {
      // Bypass builtin entities (probably fixtures)
      this.eventEmitter.emit('hook:nlpValue:create', created);
    }
  }

  /**
   * Emits an event after an NLP value is updated, bypassing built-in values.
   *
   * @param query - The query that was used to update the NLP value.
   * @param updated - The updated NLP value document.
   */
  async postUpdate(
    _query: Query<
      Document<NlpValue, any, any>,
      Document<NlpValue, any, any>,
      unknown,
      NlpValue,
      'findOneAndUpdate'
    >,
    updated: NlpValue,
  ): Promise<void> {
    if (!updated?.builtin) {
      // Bypass builtin entities (probably fixtures)
      this.eventEmitter.emit('hook:nlpValue:update', updated);
    }
  }

  /**
   * Handles deletion of NLP values and associated entities. If the criteria includes an ID,
   * emits an event for each deleted entity.
   *
   * @param _query - The query used to delete the NLP value(s).
   * @param criteria - The filter criteria used to identify the NLP value(s) to delete.
   */
  async preDelete(
    _query: Query<
      DeleteResult,
      Document<NlpValue, any, any>,
      unknown,
      NlpValue,
      'deleteOne' | 'deleteMany'
    >,
    criteria: TFilterQuery<NlpValue>,
  ): Promise<void> {
    if (criteria._id) {
      await this.nlpSampleEntityRepository.deleteMany({ value: criteria._id });

      const entities = await this.find(
        typeof criteria === 'string' ? { _id: criteria } : criteria,
      );
      entities
        .filter((e) => !e.builtin)
        .map((e) => {
          this.eventEmitter.emit('hook:nlpValue:delete', e);
        });
    } else if (criteria.entity) {
      // Do nothing : cascading deletes coming from Nlp Sample Entity
    } else {
      throw new Error('Attempted to delete a NLP value using unknown criteria');
    }
  }

  private async aggregateWithCount<T extends 'full' | 'stub' = 'stub'>(
    {
      limit = 10,
      skip = 0,
      sort = ['createdAt', 'desc'],
    }: PageQueryDto<NlpValue>,
    { $and = [], ...rest }: TFilterQuery<NlpValue>,
    populatePipelineStages: PipelineStage[] = [],
  ) {
    const pipeline: PipelineStage[] = [
      {
        // support filters
        $match: {
          ...rest,
          ...($and.length && {
            $and:
              $and.map(({ entity, ...rest }) =>
                entity
                  ? {
                      ...rest,
                      entity: new Types.ObjectId(String(entity)),
                    }
                  : rest,
              ) || [],
          }),
        },
      },
      // support pageQuery
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: 'nlpsampleentities',
          localField: '_id',
          foreignField: 'value',
          as: 'sampleEntities',
        },
      },
      {
        $unwind: {
          path: '$sampleEntities',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$_id',
          value: { $first: '$value' },
          expressions: { $first: '$expressions' },
          builtin: { $first: '$builtin' },
          metadata: { $first: '$metadata' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
          entity: { $first: '$entity' },
          nlpSamplesCount: {
            $sum: { $cond: [{ $ifNull: ['$sampleEntities', false] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          id: '$_id',
          _id: 0,
          value: 1,
          expressions: 1,
          builtin: 1,
          entity: 1,
          metadata: 1,
          createdAt: 1,
          updatedAt: 1,
          nlpSamplesCount: 1,
        },
      },
      ...populatePipelineStages,
      {
        $sort: {
          [sort[0]]: sort[1].toString().startsWith('desc') ? -1 : 1,
          _id: sort[1].toString().startsWith('desc') ? -1 : 1,
        },
      },
    ];

    return await this.model.aggregate<TNlpValueCountFormat<T>>(pipeline).exec();
  }

  private async plainToClass<T extends 'full' | 'stub'>(
    format: 'full' | 'stub',
    aggregatedResults: (NlpValueWithCount | NlpValueFullWithCount)[],
  ): Promise<TNlpValueCountFormat<T>[]> {
    if (format === 'full') {
      const nestedNlpEntities: NlpValueFullWithCount[] = [];
      for (const { entity, ...rest } of aggregatedResults) {
        const plainNlpValue = {
          ...rest,
          entity: plainToClass(
            NlpEntity,
            await mongoose
              .model(NlpEntityModel.name, NlpEntityModel.schema)
              .findById(entity),
            {
              excludePrefixes: ['_'],
            },
          ),
        };
        nestedNlpEntities.push(
          plainToClass(NlpValueFullWithCount, plainNlpValue, {
            excludePrefixes: ['_'],
          }),
        );
      }
      return nestedNlpEntities as TNlpValueCountFormat<T>[];
    } else {
      const nestedNlpEntities: NlpValueWithCount[] = [];
      for (const aggregatedResult of aggregatedResults) {
        nestedNlpEntities.push(
          plainToClass(NlpValueWithCount, aggregatedResult, {
            excludePrefixes: ['_'],
          }),
        );
      }
      return nestedNlpEntities as TNlpValueCountFormat<T>[];
    }
  }

  async findWithCount(
    pageQuery: PageQueryDto<NlpValue>,
    filterQuery: TFilterQuery<NlpValue>,
  ): Promise<NlpValueWithCount[]> {
    const aggregatedResults = await this.aggregateWithCount<'stub'>(
      pageQuery,
      filterQuery,
    );

    return await this.plainToClass<'stub'>('stub', aggregatedResults);
  }

  async findAndPopulateWithCount(
    pageQuery: PageQueryDto<NlpValue>,
    filterQuery: TFilterQuery<NlpValue>,
  ): Promise<NlpValueFullWithCount[]> {
    const aggregatedResults = await this.aggregateWithCount<'full'>(
      pageQuery,
      filterQuery,
      [
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
      ],
    );

    return await this.plainToClass<'full'>('full', aggregatedResults);
  }
}
