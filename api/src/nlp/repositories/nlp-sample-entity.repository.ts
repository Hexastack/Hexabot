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
import { TFilterQuery, Model } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';

import {
  NlpSampleEntity,
  NlpSampleEntityFull,
} from '../schemas/nlp-sample-entity.schema';

@Injectable()
export class NlpSampleEntityRepository extends BaseRepository<
  NlpSampleEntity,
  'entity' | 'value' | 'sample'
> {
  constructor(
    @InjectModel(NlpSampleEntity.name) readonly model: Model<NlpSampleEntity>,
  ) {
    super(model, NlpSampleEntity);
  }

  /**
   * Finds a paginated set of `NlpSampleEntity` documents based on the provided filter
   * and page query. Also populates related fields such as `entity`, `value`, and `sample`.
   *
   * @param filter - The query filter for retrieving documents.
   * @param pageQuery - The pagination options.
   * @returns The paginated results with populated fields.
   */
  async findPageAndPopulate(
    filter: TFilterQuery<NlpSampleEntity>,
    pageQuery: PageQueryDto<NlpSampleEntity>,
  ) {
    const query = this.findPageQuery(filter, pageQuery).populate([
      'entity',
      'value',
      'sample',
    ]);
    return await this.execute(query, NlpSampleEntityFull);
  }

  /**
   * Finds a single `NlpSampleEntity` document by ID and populates the related fields `entity`, `value`, and `sample`.
   *
   * @param id - The ID of the document to retrieve.
   * @returns The document with populated fields.
   */
  async findOneAndPopulate(id: string) {
    const query = this.findOneQuery(id).populate(['entity', 'value', 'sample']);
    return await this.executeOne(query, NlpSampleEntityFull);
  }
}
