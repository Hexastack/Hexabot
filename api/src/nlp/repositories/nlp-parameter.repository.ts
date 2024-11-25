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
  NLP_PARAMETER_POPULATE,
  NlpParameter,
  NlpParameterFull,
  NlpParameterPopulate,
} from '../schemas/nlp-parameter.schema';

import { NlpDatasetRepository } from './nlp-dataset.repository';
import { NlpExperimentRepository } from './nlp-experiment.repository';
import { NlpParameterValueRepository } from './nlp-parameter.value.repository';

@Injectable()
export class NlpParameterRepository extends BaseRepository<
  NlpParameter,
  NlpParameterPopulate,
  NlpParameterFull
> {
  constructor(
    readonly eventEmitter: EventEmitter2,
    @InjectModel(NlpParameter.name) readonly model: Model<NlpParameter>,
    private readonly nlpExperimentRepository: NlpExperimentRepository,
    private readonly nlpParameterValueRepository: NlpParameterValueRepository,
    private readonly nlpDatasetRepository: NlpDatasetRepository,
  ) {
    super(
      eventEmitter,
      model,
      NlpParameter,
      NLP_PARAMETER_POPULATE,
      NlpParameterFull,
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
      Document<NlpParameter, any, any>,
      unknown,
      NlpParameter,
      'deleteOne' | 'deleteMany'
    >,
    criteria: TFilterQuery<NlpParameter>,
  ): Promise<void> {
    {
      if (criteria._id || criteria.name) {
        // Find associated parameter values
        const parameterValues = (
          await this.nlpParameterValueRepository.find({
            parameter: criteria.name,
          })
        ).map((doc) => ({ parameter: doc.parameter, value: doc.value }));

        if (parameterValues.length > 0) {
          // Find experiments associated with the parameters
          const experimentsIds = (
            await this.nlpExperimentRepository.find({
              parameters: {
                $in: parameterValues.map((val) => {
                  val.parameter, val.value;
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
            // Update or delete model associated with the experiments

            await this.nlpExperimentRepository.deleteMany({
              _id: { $in: experimentsIds },
            });
          }
          // Remove the processed parameter values
          await this.nlpParameterValueRepository.deleteMany({
            parameter: {
              $in: parameterValues.map((val) => {
                val.parameter, val.value;
              }),
            },
          });
        }
      } else {
        throw new Error(
          'Attempted to delete NLP parameters using unknown criteria',
        );
      }
    }
  }
}
