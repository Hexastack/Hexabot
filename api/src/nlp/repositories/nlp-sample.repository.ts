/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Query, TFilterQuery } from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';

import { NlpSampleEntityRepository } from './nlp-sample-entity.repository';
import { NlpSample, NlpSampleFull } from '../schemas/nlp-sample.schema';

@Injectable()
export class NlpSampleRepository extends BaseRepository<NlpSample, 'entities'> {
  constructor(
    @InjectModel(NlpSample.name) readonly model: Model<NlpSample>,
    private readonly nlpSampleEntityRepository: NlpSampleEntityRepository,
  ) {
    super(model, NlpSample);
  }

  /**
   * Deletes NLP sample entities associated with the provided criteria before deleting the sample itself.
   *
   * @param query - The query object used for deletion.
   * @param criteria - Criteria to identify the sample(s) to delete.
   */
  async preDelete(
    _query: Query<
      DeleteResult,
      Document<NlpSample, any, any>,
      unknown,
      NlpSample,
      'deleteOne' | 'deleteMany'
    >,
    criteria: TFilterQuery<NlpSample>,
  ) {
    if (criteria._id) {
      await this.nlpSampleEntityRepository.deleteMany({
        sample: criteria._id,
      });
    } else {
      throw new Error(
        'Attempted to delete a NLP sample using unknown criteria',
      );
    }
  }

  /**
   * Retrieves a paginated list of NLP samples and populates the related entities.
   *
   * @param filter Query filter used to retrieve NLP samples.
   * @param pageQuery Pagination details for the query.
   *
   * @returns A promise that resolves to a paginated list of `NlpSampleFull` objects.
   */
  async findPageAndPopulate(
    filter: TFilterQuery<NlpSample>,
    pageQuery: PageQueryDto<NlpSample>,
  ): Promise<NlpSampleFull[]> {
    const query = this.findPageQuery(filter, pageQuery).populate(['entities']);
    return await this.execute(query, NlpSampleFull);
  }

  /**
   * Finds all NLP samples that match the filter and populates related entities.
   *
   * @param filter Query filter used to retrieve NLP samples.
   *
   * @returns A promise that resolves to a list of `NlpSampleFull` objects.
   */
  async findAndPopulate(
    filter: TFilterQuery<NlpSample>,
  ): Promise<NlpSampleFull[]> {
    const query = this.findQuery(filter).populate(['entities']);
    return await this.execute(query, NlpSampleFull);
  }

  /**
   * Finds an NLP sample by its ID and populates related entities.
   *
   * @param id The ID of the NLP sample to retrieve.
   *
   * @returns A promise that resolves to the `NlpSampleFull` object.
   */
  async findOneAndPopulate(id: string): Promise<NlpSampleFull> {
    const query = this.findOneQuery(id).populate(['entities']);
    return await this.executeOne(query, NlpSampleFull);
  }

  /**
   * Retrieves all NLP samples and populates related entities.
   *
   * @returns A promise that resolves to a list of all `NlpSampleFull` objects.
   */
  async findAllAndPopulate() {
    const query = this.findAllQuery().populate(['entities']);
    return await this.execute(query, NlpSampleFull);
  }
}
