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

import { NlpMetricValueDto } from '../dto/nlp-metric-value.dto';
import { NlpMetricValueRepository } from '../repositories/nlp-metric-value.repository';
import {
  NlpMetricValue,
  NlpMetricValueFull,
  NlpMetricValuePopulate,
} from '../schemas/nlp-metric-value.schema';

import { NlpModelService } from './nlp-model.service';

@Injectable()
export class NlpMetricValueService extends BaseService<
  NlpMetricValue,
  NlpMetricValuePopulate,
  NlpMetricValueFull
> {
  constructor(
    readonly repository: NlpMetricValueRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly nlpModelService: NlpModelService,
  ) {
    super(repository);
  }

  /**
   * Create a new NLP MetricValue.
   * @param nlpMetricValueDto - Data transfer object for creating an MetricValue
   * @returns {Promise<void>} - Created MetricValue details
   */
  async createMetricValue(nlpMetricValueDto: NlpMetricValueDto): Promise<void> {
    const MetricValue = new NlpMetricValue();
    Object.assign(MetricValue, nlpMetricValueDto);

    // Create the MetricValue in the repository
    await this.repository.create(MetricValue);
  }

  /**
   * Update an existing NLP MetricValue.
   * @param id - The ID of the MetricValue to update
   * @param nlpMetricValueDto - The data to update the MetricValue with
   * @returns {Promise<void>} - Updated MetricValue details
   */
  async updateMetricValue(
    id: string,
    nlpMetricValueDto: NlpMetricValueDto,
  ): Promise<void> {
    // Perform the update in the repository
    await this.repository.updateOne(id, nlpMetricValueDto);
  }

  /**
   * Delete an NLP MetricValue and its related data.
   * @param id - The ID of the MetricValue to delete
   * @returns {Promise<void>} - A promise indicating completion
   */
  async deleteCascadeMetricValue(id: string): Promise<void> {
    // Perform the delete operation in the repository
    await this.repository.deleteOne(id);
  }
}
