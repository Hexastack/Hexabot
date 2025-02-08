/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Query } from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';
import { TFilterQuery } from '@/utils/types/filter.types';

import {
  NLP_METRIC_POPULATE,
  NlpMetric,
  NlpMetricFull,
  NlpMetricPopulate,
} from '../schemas/nlp-metric.schema';

import { NlpDatasetRepository } from './nlp-dataset.repository';
import { NlpExperimentRepository } from './nlp-experiment.repository';
import { NlpMetricValueRepository } from './nlp-metric-value.repository';

@Injectable()
export class NlpMetricRepository extends BaseRepository<
  NlpMetric,
  NlpMetricPopulate,
  NlpMetricFull
> {
  constructor(
    readonly eventEmitter: EventEmitter2,
    @InjectModel(NlpMetric.name) readonly model: Model<NlpMetric>,
    private readonly nlpExperimentRepository: NlpExperimentRepository,
    private readonly nlpMetricValueRepository: NlpMetricValueRepository,
    private readonly nlpDatasetRepository: NlpDatasetRepository,
  ) {
    super(eventEmitter, model, NlpMetric, NLP_METRIC_POPULATE, NlpMetricFull);
  }

  /**
   * Deletes NLP experiment associated with the provided criteria before deleting the metrics themselves.
   *
   * @param query - The query object used for deletion.
   * @param criteria - Criteria to identify the sample(s) to delete.
   */
  async preDelete(
    _query: Query<
      DeleteResult,
      Document<NlpMetric, any, any>,
      unknown,
      NlpMetric,
      'deleteOne' | 'deleteMany'
    >,
    criteria: TFilterQuery<NlpMetric>,
  ): Promise<void> {
    {
      if (criteria._id || criteria.name) {
        // Find associated metric values
        const metricValues = (
          await this.nlpMetricValueRepository.find({ metric: criteria.name })
        ).map((doc) => ({ metric: doc.metric, value: doc.value }));

        if (metricValues.length > 0) {
          // Find experiments associated with the metrics
          const experimentsIds = (
            await this.nlpExperimentRepository.find({
              metrics: {
                $in: metricValues.map((val) => {
                  val.metric, val.value;
                }),
              },
            })
          ).map((doc) => doc.id);
          if (experimentsIds.length > 0) {
            for (const relatedId of experimentsIds) {
              await this.nlpDatasetRepository.updateMany(
                { experiments: relatedId },
                {
                  $pull: { experiments: relatedId },
                },
              );
            }
            // Remove the processed experiments
            await this.nlpExperimentRepository.deleteMany({
              _id: { $in: experimentsIds },
            });
          }
          // Remove the processed metric values
          await this.nlpMetricValueRepository.deleteMany({
            metric: {
              $in: metricValues.map((val) => {
                val.metric, val.value;
              }),
            },
          });
        }
      } else {
        throw new Error(
          'Attempted to delete NLP metrics using unknown criteria',
        );
      }
    }
  }
}
