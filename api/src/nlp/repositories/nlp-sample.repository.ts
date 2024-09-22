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

import { NlpSampleEntityRepository } from './nlp-sample-entity.repository';
import {
  NLP_SAMPLE_POPULATE,
  NlpSample,
  NlpSampleFull,
  NlpSamplePopulate,
} from '../schemas/nlp-sample.schema';

@Injectable()
export class NlpSampleRepository extends BaseRepository<
  NlpSample,
  NlpSamplePopulate,
  NlpSampleFull
> {
  constructor(
    @InjectModel(NlpSample.name) readonly model: Model<NlpSample>,
    private readonly nlpSampleEntityRepository: NlpSampleEntityRepository,
  ) {
    super(model, NlpSample, NLP_SAMPLE_POPULATE, NlpSampleFull);
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
}
