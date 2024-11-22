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

import { NlpMetricValueRepository } from './nlp-metric-value.repository';
import { NlpMetricRepository } from './nlp-metric.repository';
import { NlpModelRepository } from './nlp-model.repository';
import { NlpParameterRepository } from './nlp-parameter.repository';
import { NlpParameterValueRepository } from './nlp-parameter.value.repository';

@Injectable()
export class NlpExperimentRepository extends BaseRepository<
  NlpExperiment,
  NlpExperimentPopulate,
  NlpExperimentFull
> {
  constructor(
    readonly eventEmitter: EventEmitter2,
    @InjectModel(NlpExperiment.name) readonly model: Model<NlpExperiment>,
    private readonly nlpMetricValueRepository: NlpMetricValueRepository,
    private readonly nlpParameterValueRepository: NlpParameterValueRepository,
    private readonly nlpMetricRepository: NlpMetricRepository,
    private readonly nlpParameterRepository: NlpParameterRepository,
    private readonly nlpModelRepository: NlpModelRepository,
  ) {
    super(
      eventEmitter,
      model,
      NlpExperiment,
      NLP_EXPERIMENT_POPULATE,
      NlpExperimentFull,
    );
  }

  async preCreate(experiment: Partial<NlpExperiment>): Promise<void> {
    if (!experiment.model) {
      throw new Error('Experiment must be associated with a model.');
    }

    const updatedModel = await this.nlpModelRepository.updateOne(
      { _id: experiment.model },
      { $inc: { version: 1 } },
    );

    if (!updatedModel) {
      throw new Error(`Model with ID ${experiment.model} not found.`);
    } else {
      // Set the experiment's version to the updated model version
      experiment.current_version = updatedModel.version;
    }
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
        await this.nlpParameterValueRepository.deleteMany({
          experiment: criteria._id,
        });

        await this.nlpMetricValueRepository.deleteMany({
          experiment: criteria._id,
        });
        this.nlpMetricRepository.updateOne(
          { experiments: criteria._id },
          {
            $pull: { experiments: criteria._id },
          },
        );
        this.nlpParameterRepository.updateOne(
          { experiments: criteria._id },
          {
            $pull: { experiments: criteria._id },
          },
        );
        const updatedModel = await this.nlpModelRepository.updateOne(
          { experiments: criteria._id }, // Valid for single ObjectId
          {
            $pull: { experiments: criteria._id },
            $inc: { version: -1 },
          },
        );
        if (
          updatedModel &&
          updatedModel.version <= 0 &&
          updatedModel.experiments.length === 0
        ) {
          await this.nlpMetricRepository.updateOne(
            { models: updatedModel.id },
            {
              $pull: { experiments: updatedModel.id },
            },
          );

          // Delete the model if conditions are met
          await this.nlpModelRepository.deleteOne({
            _id: updatedModel.id,
          });
        }
      } else {
        throw new Error(
          'Attempted to delete NLP experiment using unknown criteria',
        );
      }
    }
  }
}
