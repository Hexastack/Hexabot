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
import { Document, FilterQuery, Model, Query } from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';

import {
  NLP_PARAMETERS_POPULATE,
  NlpParameters,
  NlpParametersFull,
  NlpParametersPopulate,
} from '../schemas/nlp-parameters.schema';

import { NlpExperimentRepository } from './nlp-experiment.repository';

@Injectable()
export class NlpParametersRepository extends BaseRepository<
  NlpParameters,
  NlpParametersPopulate,
  NlpParametersFull
> {
  constructor(
    readonly eventEmitter: EventEmitter2,
    @InjectModel(NlpParameters.name) readonly model: Model<NlpParameters>,
    private readonly nlpExperimentRepository: NlpExperimentRepository,
  ) {
    super(
      eventEmitter,
      model,
      NlpParameters,
      NLP_PARAMETERS_POPULATE,
      NlpParametersFull,
    );
  }

  /**
   * Deletes NLP experiment associated with the provided criteria before deleting the parameters themselves.
   *
   * @param query - The query object used for deletion.
   * @param criteria - Criteria to identify the sample(s) to delete.
   */
  async preDelete(
    _query: Query<
      DeleteResult,
      Document<NlpParameters, any, any>,
      unknown,
      NlpParameters,
      'deleteOne' | 'deleteMany'
    >,
    criteria: FilterQuery<NlpParameters>,
  ): Promise<void> {
    {
      if (criteria._id) {
        await this.nlpExperimentRepository.deleteMany({
          parameters: criteria._id,
        });
      } else {
        throw new Error(
          'Attempted to delete NLP parameters using unknown criteria',
        );
      }
    }
  }
}
