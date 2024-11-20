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
  NLP_EXPERIMENT_POPULATE,
  NlpExperiment,
  NlpExperimentFull,
  NlpExperimentPopulate,
} from '../schemas/nlp-experiment.schema';

import { NlpMetricsRepository } from './nlp-metrics.repository';
import { NlpParametersRepository } from './nlp-parameters.repository';

@Injectable()
export class NlpExperimentRepository extends BaseRepository<
  NlpExperiment,
  NlpExperimentPopulate,
  NlpExperimentFull
> {
  constructor(
    readonly eventEmitter: EventEmitter2,
    @InjectModel(NlpExperiment.name) readonly model: Model<NlpExperiment>,
    private readonly nlpMetricsRepository: NlpMetricsRepository,
    private readonly nlpParametersRepository: NlpParametersRepository,
  ) {
    super(
      eventEmitter,
      model,
      NlpExperiment,
      NLP_EXPERIMENT_POPULATE,
      NlpExperimentFull,
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
      Document<NlpExperiment, any, any>,
      unknown,
      NlpExperiment,
      'deleteOne' | 'deleteMany'
    >,
    criteria: TFilterQuery<NlpExperiment>,
  ): Promise<void> {
    {
      if (criteria._id) {
        await this.nlpParametersRepository.deleteMany({
          experiment: criteria._id,
        });

        await this.nlpMetricsRepository.deleteMany({
          experiment: criteria._id,
        });
      } else {
        throw new Error(
          'Attempted to delete NLP experiment using unknown criteria',
        );
      }
    }
  }
}
