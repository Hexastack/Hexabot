/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';

import { BaseService } from '@/utils/generics/base-service';

import { Lookup, NlpEntityDto } from '../dto/nlp-entity.dto';
import { NlpEntityRepository } from '../repositories/nlp-entity.repository';
import {
  NlpEntity,
  NlpEntityFull,
  NlpEntityPopulate,
} from '../schemas/nlp-entity.schema';
import { NlpSampleEntityValue } from '../schemas/types';

import { NlpValueService } from './nlp-value.service';

@Injectable()
export class NlpEntityService extends BaseService<
  NlpEntity,
  NlpEntityPopulate,
  NlpEntityFull,
  NlpEntityDto
> {
  constructor(
    readonly repository: NlpEntityRepository,
    private readonly nlpValueService: NlpValueService,
  ) {
    super(repository);
  }

  /**
   * Deletes an entity by its ID.
   *
   * @param id - The ID of the entity to delete.
   *
   * @returns A promise that resolves when the entity is deleted.
   */
  async deleteCascadeOne(id: string) {
    return await this.repository.deleteOne(id);
  }

  /**
   * Stores new entities based on the sample text and sample entities.
   * Deletes all values relative to this entity before deleting the entity itself.
   * This is typically used during an import process.
   *
   * @param sampleText - The text sample containing NLP entities.
   * @param sampleEntities - The list of sample entity values to be processed.
   * @param lookups - Optional list of lookups used to classify the entities.
   *
   * @returns A promise that resolves when the entities and their values are stored.
   */
  async storeNewEntities(
    sampleText: string,
    sampleEntities: NlpSampleEntityValue[],
    lookups: Lookup[] = ['keywords'],
  ) {
    // Extract entity names from sampleEntities
    const entities = sampleEntities.map((e) => e.entity);

    // Retrieve stored entities
    let storedEntities = (await this.find({ name: { $in: entities } })) || [];
    // Find newly added entities
    const entitiesToAdd = entities
      .filter((e) => storedEntities.findIndex((se) => se.name === e) === -1)
      .filter((e, idx, self) => self.indexOf(e) === idx)
      .map((e) => ({ name: e, lookups }));
    // Create new entities
    const newEntities = await this.createMany(entitiesToAdd);
    // Add new entities to the storedEntities array
    storedEntities = storedEntities.concat(newEntities);
    return await this.nlpValueService.storeNewValues(
      sampleText,
      sampleEntities,
      storedEntities,
    );
  }

  /**
   * Stores only new entities based on the provided sample entities and returns them.
   * It creates new entities if they do not already exist.
   *
   * @param sampleEntities - The list of sample entity values to process.
   *
   * @returns A promise that resolves with the list of stored entities, including their IDs.
   */
  storeEntities(sampleEntities: NlpSampleEntityValue[]): Promise<NlpEntity[]> {
    const findOrCreate = sampleEntities.map((e: NlpSampleEntityValue) =>
      this.findOneOrCreate({ name: e.entity }, { name: e.entity }),
    );
    return Promise.all(findOrCreate);
  }
}
