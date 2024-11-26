/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { BaseService } from '@/utils/generics/base-service';

import { NlpExperimentDto } from '../dto/nlp-experiment.dto';
import { NlpExperimentRepository } from '../repositories/nlp-experiment.repository';
import {
  NlpExperiment,
  NlpExperimentFull,
  NlpExperimentPopulate,
} from '../schemas/nlp-experiment.schema';

import { NlpModelService } from './nlp-model.service';

@Injectable()
export class NlpExperimentService extends BaseService<
  NlpExperiment,
  NlpExperimentPopulate,
  NlpExperimentFull
> {
  constructor(
    readonly repository: NlpExperimentRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly nlpModelService: NlpModelService,
  ) {
    super(repository);
  }

  /**
   * Create a new NLP experiment.
   * @param nlpExperimentDto - Data transfer object for creating an experiment
   * @returns {Promise<void>} - Created experiment details
   */
  async createExperiment(nlpExperimentDto: NlpExperimentDto): Promise<void> {
    const experiment = new NlpExperiment();
    Object.assign(experiment, nlpExperimentDto);

    // Create the experiment in the repository
    await this.repository.create(experiment);
  }

  /**
   * Update an existing NLP experiment.
   * @param id - The ID of the experiment to update
   * @param nlpExperimentDto - The data to update the experiment with
   * @returns {Promise<void>} - Updated experiment details
   */
  async updateExperiment(
    id: string,
    nlpExperimentDto: NlpExperimentDto,
  ): Promise<void> {
    // Perform the update in the repository
    await this.repository.updateOne(id, nlpExperimentDto);
  }

  /**
   * Delete an NLP experiment and its related data.
   * @param id - The ID of the experiment to delete
   * @returns {Promise<void>} - A promise indicating completion
   */
  async deleteCascadeExperiment(id: string): Promise<void> {
    // Perform the delete operation in the repository
    await this.repository.deleteOne(id);
  }

  /**
   * Get all completed NLP experiments.
   * @returns {Promise<NlpExperiment[]>} - List of completed experiments
   */
  async getCompletedExperiments(): Promise<NlpExperiment[]> {
    const experiments = await this.repository.find({
      isCompleted: true,
    });

    return experiments;
  }

  /**
   * Get an experiment by its ID.
   * @param id - The ID of the experiment to retrieve
   * @returns {Promise<NlpExperimentFull | null>} - The experiment, or null if not found
   */
  async getExperimentById(id: string): Promise<NlpExperimentFull | null> {
    const experiment = await this.repository.findOne(id);
    return experiment;
  }

  /**
   * Get a map of experiments by their `foreign_id`.
   * @param experiments - Array of experiments
   * @returns {Record<string, NlpExperimentFull>} - Map with `foreign_id` as key
   */
  getExperimentMap(
    experiments: NlpExperiment[],
  ): Record<string, NlpExperiment> {
    return NlpExperiment.getExperimentMap(experiments);
  }
}
