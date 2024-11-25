/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import assert from 'assert';

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Query } from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';
import { TFilterQuery } from '@/utils/types/filter.types';

import {
  NLP_METRIC_VALUE_POPULATE,
  NlpMetricValue,
  NlpMetricValueFull,
  NlpMetricValuePopulate,
} from '../schemas/nlp-metric-value.schema';

import { NlpDatasetRepository } from './nlp-dataset.repository';
import { NlpExperimentRepository } from './nlp-experiment.repository';

@Injectable()
export class NlpMetricValueRepository extends BaseRepository<
  NlpMetricValue,
  NlpMetricValuePopulate,
  NlpMetricValueFull
> {
  constructor(
    readonly eventEmitter: EventEmitter2,
    @InjectModel(NlpMetricValue.name) readonly model: Model<NlpMetricValue>,
    private readonly nlpExperimentRepository: NlpExperimentRepository,
    private readonly nlpDatasetRepository: NlpDatasetRepository,
  ) {
    super(
      eventEmitter,
      model,
      NlpMetricValue,
      NLP_METRIC_VALUE_POPULATE,
      NlpMetricValueFull,
    );
  }

  async preCreate(metricValue: Partial<NlpMetricValue>): Promise<void> {
    const experiment = await this.nlpExperimentRepository.findOne({
      _id: metricValue.experiment,
    });

    if (!experiment) {
      throw new Error(
        `Experiment with ID ${metricValue.experiment} not found.`,
      );
    }

    assert(
      metricValue.version === experiment.current_version,
      `Metric Value version (${metricValue.version}) does not match the experiment's current version (${experiment.current_version}).`,
    );
  }

  /**
   * Deletes NLP experiment associated with the provided criteria before deleting the metric values themselves.
   *
   * @param query - The query object used for deletion.
   * @param criteria - Criteria to identify the sample(s) to delete.
   */
  async preDelete(
    _query: Query<
      DeleteResult,
      Document<NlpMetricValue, any, any>,
      unknown,
      NlpMetricValue,
      'deleteOne' | 'deleteMany'
    >,
    criteria: TFilterQuery<NlpMetricValue>,
  ): Promise<void> {
    {
      if (criteria) {
        const relatedExperimentIds = await this.nlpExperimentRepository
          .find({
            metrics: {
              $elemMatch: { metric: criteria.metric, value: criteria.value },
            },
          })
          .then((results) => results.map((doc) => doc.id));

        if (relatedExperimentIds.length > 0) {
          for (const relatedId of relatedExperimentIds) {
            await this.nlpDatasetRepository.updateMany(
              { experiments: relatedId },
              {
                $pull: { experiments: relatedId },
              },
            );
          }
          await this.nlpExperimentRepository.deleteMany({
            _id: { $in: relatedExperimentIds },
          });
        } else {
          throw new Error(
            'Attempted to delete NLP experiment using unknown criteria',
          );
        }
      }
    }
  }
}
