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
  NLP_METRICS_POPULATE,
  NlpMetrics,
  NlpMetricsFull,
  NlpMetricsPopulate,
} from '../schemas/nlp-metrics.schema';

import { NlpExperimentRepository } from './nlp-experiment.repository';

@Injectable()
export class NlpMetricsRepository extends BaseRepository<
  NlpMetrics,
  NlpMetricsPopulate,
  NlpMetricsFull
> {
  constructor(
    readonly eventEmitter: EventEmitter2,
    @InjectModel(NlpMetrics.name) readonly model: Model<NlpMetrics>,
    private readonly nlpExperimentRepository: NlpExperimentRepository,
  ) {
    super(
      eventEmitter,
      model,
      NlpMetrics,
      NLP_METRICS_POPULATE,
      NlpMetricsFull,
    );
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
      Document<NlpMetrics, any, any>,
      unknown,
      NlpMetrics,
      'deleteOne' | 'deleteMany'
    >,
    criteria: TFilterQuery<NlpMetrics>,
  ): Promise<void> {
    {
      if (criteria._id) {
        await this.nlpExperimentRepository.deleteMany({
          parameters: criteria._id,
        });
      } else {
        throw new Error(
          'Attempted to delete NLP metrics using unknown criteria',
        );
      }
    }
  }
}
