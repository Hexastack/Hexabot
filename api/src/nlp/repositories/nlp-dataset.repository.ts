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
  NLP_DATASET_POPULATE,
  NlpDataset,
  NlpDatasetFull,
  NlpDatasetPopulate,
} from '../schemas/nlp-dataset.schema';
import { NlpModelService } from '../services/nlp-model.service';

import { NlpExperimentRepository } from './nlp-experiment.repository';

@Injectable()
export class NlpDatasetRepository extends BaseRepository<
  NlpDataset,
  NlpDatasetPopulate,
  NlpDatasetFull
> {
  constructor(
    readonly eventEmitter: EventEmitter2,
    @InjectModel(NlpDataset.name) readonly model: Model<NlpDataset>,
    private readonly nlpExperimentRepository: NlpExperimentRepository,
    private readonly nlpModelService: NlpModelService,
  ) {
    super(
      eventEmitter,
      model,
      NlpDataset,
      NLP_DATASET_POPULATE,
      NlpDatasetFull,
    );
  }

  /**
   * Pre-processing logic for updating a dataset.
   *
   * @param query - The query to update a dataset.
   * @param criteria - The filter criteria for the update query.
   * @param updates - The update data.
   */
  async preUpdate(
    _query: Query<
      Document<NlpDataset, any, any>,
      Document<NlpDataset, any, any>,
      unknown,
      NlpDataset,
      'findOneAndUpdate'
    >,
    criteria: TFilterQuery<NlpDataset>,
  ): Promise<void> {
    const dataset: NlpDataset = await this.findOne(criteria);

    if (!dataset) {
      return;
    } else {
      await this.updateOne(
        { _id: dataset.id },
        { $inc: { current_version: 1 } },
      );
    }
  }

  /**
   * Pre-create hook to ensure the version is updated based on the cached NLP model.
   * @param dataset - The NLP dataset to be created.
   */
  async preCreate(dataset: NlpDataset): Promise<void> {
    const modelName = dataset.model;

    // Retrieve the cached NLP model by name
    const cachedModel = await this.nlpModelService.getModel(modelName);

    if (cachedModel) {
      // If the model is found in the cache, increment the version
      dataset.current_version = cachedModel.version + 1;
    } else {
      // If no model is found in the cache, you could set a default version or handle the case
      dataset.current_version = 1; // or handle it as per your business logic
    }
  }

  /**
   * Updates NLP experiment associated with the provided criteria before deleting the datasets themselves.
   *
   * @param query - The query object used for deletion.
   * @param criteria - Criteria to identify the sample(s) to delete.
   */
  async preDelete(
    _query: Query<
      DeleteResult,
      Document<NlpDataset, any, any>,
      unknown,
      NlpDataset,
      'deleteOne' | 'deleteMany'
    >,
    criteria: TFilterQuery<NlpDataset>,
  ): Promise<void> {
    {
      if (criteria._id) {
        await this.nlpExperimentRepository.updateOne(
          { datasets: criteria._id },
          {
            $pull: { datasets: criteria._id },
          },
        );
      } else {
        throw new Error(
          'Attempted to delete NLP experiment using unknown criteria',
        );
      }
    }
  }
}
