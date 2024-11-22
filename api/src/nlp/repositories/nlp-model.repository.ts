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
  NLP_MODEL_POPULATE,
  NlpModel,
  NlpModelFull,
  NlpModelPopulate,
} from '../schemas/nlp-model.schema';

import { NlpExperimentRepository } from './nlp-experiment.repository';
import { NlpMetricValueRepository } from './nlp-metric-value.repository';
import { NlpParameterValueRepository } from './nlp-parameter.value.repository';

@Injectable()
export class NlpModelRepository extends BaseRepository<
  NlpModel,
  NlpModelPopulate,
  NlpModelFull
> {
  constructor(
    readonly eventEmitter: EventEmitter2,
    @InjectModel(NlpModel.name) readonly model: Model<NlpModel>,
    private readonly nlpExperimentRepository: NlpExperimentRepository,
    private readonly nlpMetricValueRepository: NlpMetricValueRepository,
    private readonly nlpParameterValueRepository: NlpParameterValueRepository,
  ) {
    super(eventEmitter, model, NlpModel, NLP_MODEL_POPULATE, NlpModelFull);
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
      Document<NlpModel, any, any>,
      unknown,
      NlpModel,
      'deleteOne' | 'deleteMany'
    >,
    criteria: TFilterQuery<NlpModel>,
  ): Promise<void> {
    {
      if (criteria._id) {
        await this.nlpExperimentRepository.deleteMany({
          model: criteria._id,
        });
        await this.nlpMetricValueRepository.deleteMany({
          model: criteria._id,
        });
        await this.nlpParameterValueRepository.deleteMany({
          model: criteria._id,
        });
      } else {
        throw new Error('Attempted to delete NLP model using unknown criteria');
      }
    }
  }
}
