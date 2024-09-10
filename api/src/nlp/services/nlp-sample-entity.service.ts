/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Injectable } from '@nestjs/common';
import { TFilterQuery } from 'mongoose';

import { BaseService } from '@/utils/generics/base-service';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';

import { NlpEntityService } from './nlp-entity.service';
import { NlpValueService } from './nlp-value.service';
import { NlpSampleEntityRepository } from '../repositories/nlp-sample-entity.repository';
import { NlpSampleEntity } from '../schemas/nlp-sample-entity.schema';
import { NlpSample } from '../schemas/nlp-sample.schema';
import { NlpSampleEntityValue } from '../schemas/types';

@Injectable()
export class NlpSampleEntityService extends BaseService<NlpSampleEntity> {
  constructor(
    readonly repository: NlpSampleEntityRepository,
    private readonly nlpEntityService: NlpEntityService,
    private readonly nlpValueService: NlpValueService,
  ) {
    super(repository);
  }

  /**
   * Retrieves a single NLP sample entity by its ID and populates related
   * entities for the retrieved sample.
   *
   * @param id The ID of the NLP sample entity to find and populate.
   *
   * @returns The populated NLP sample entity.
   */
  async findOneAndPopulate(id: string) {
    return await this.repository.findOneAndPopulate(id);
  }

  /**
   * Retrieves a paginated list of NLP sample entities based on filters, and
   * populates related entities for each retrieved sample entity.
   *
   * @param filters Filters to apply when searching for the entities.
   * @param pageQuery Query parameters for pagination.
   *
   * @returns A paginated list of populated NLP sample entities.
   */
  async findPageAndPopulate(
    filters: TFilterQuery<NlpSampleEntity>,
    pageQuery: PageQueryDto<NlpSampleEntity>,
  ) {
    return await this.repository.findPageAndPopulate(filters, pageQuery);
  }

  /**
   * Adds new sample entities to the corresponding training sample and returns
   * the created sample entities. It handles the storage of new entities and
   * their values and links them with the sample.
   *
   * @param sample The training sample to which the entities belong.
   * @param entities The array of entity values to store and link to the sample.
   *
   * @returns The newly created sample entities.
   */
  async storeSampleEntities(
    sample: NlpSample,
    entities: NlpSampleEntityValue[],
  ): Promise<NlpSampleEntity[]> {
    // Store any new entity/value
    const storedEntities = await this.nlpEntityService.storeEntities(entities);

    const storedValues = await this.nlpValueService.storeValues(
      sample.text,
      entities,
    );

    // Store sample entities
    const sampleEntities = entities.map((e) => {
      const storedEntity = storedEntities.find((se) => se.name === e.entity);
      const storedValue = storedValues.find((sv) => sv.value === e.value);
      if (!storedEntity || !storedValue) {
        throw new Error('Unable to find the stored entity or value');
      }
      return {
        sample: sample.id,
        entity: storedEntity.id, // replace entity name by id
        value: storedValue.id, // replace value by id
        start: 'start' in e ? e.start : undefined,
        end: 'end' in e ? e.end : undefined,
      } as NlpSampleEntity;
    });

    return this.createMany(sampleEntities);
  }
}
