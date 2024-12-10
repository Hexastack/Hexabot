/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';

import { BaseService } from '@/utils/generics/base-service';

import { NlpSampleEntityRepository } from '../repositories/nlp-sample-entity.repository';
import {
  NlpSampleEntity,
  NlpSampleEntityFull,
  NlpSampleEntityPopulate,
} from '../schemas/nlp-sample-entity.schema';
import { NlpSample } from '../schemas/nlp-sample.schema';
import { NlpSampleEntityValue } from '../schemas/types';

import { NlpEntityService } from './nlp-entity.service';
import { NlpValueService } from './nlp-value.service';

@Injectable()
export class NlpSampleEntityService extends BaseService<
  NlpSampleEntity,
  NlpSampleEntityPopulate,
  NlpSampleEntityFull
> {
  constructor(
    readonly repository: NlpSampleEntityRepository,
    private readonly nlpEntityService: NlpEntityService,
    private readonly nlpValueService: NlpValueService,
  ) {
    super(repository);
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

    return await this.createMany(sampleEntities);
  }
}
