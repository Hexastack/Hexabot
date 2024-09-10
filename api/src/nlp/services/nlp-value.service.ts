/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { TFilterQuery } from 'mongoose';

import { BaseService } from '@/utils/generics/base-service';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';

import { NlpEntityService } from './nlp-entity.service';
import { NlpValueCreateDto, NlpValueUpdateDto } from '../dto/nlp-value.dto';
import { NlpValueRepository } from '../repositories/nlp-value.repository';
import { NlpEntity } from '../schemas/nlp-entity.schema';
import { NlpValue } from '../schemas/nlp-value.schema';
import { NlpSampleEntityValue } from '../schemas/types';

@Injectable()
export class NlpValueService extends BaseService<NlpValue> {
  constructor(
    readonly repository: NlpValueRepository,
    @Inject(forwardRef(() => NlpEntityService))
    private readonly nlpEntityService: NlpEntityService,
  ) {
    super(repository);
  }

  /**
   * Deletes an NLP value by its ID, cascading any dependent data.
   *
   * @param id The ID of the NLP value to delete.
   *
   * @returns A promise that resolves when the deletion is complete.
   */
  async deleteCascadeOne(id: string) {
    return await this.repository.deleteOne(id);
  }

  /**
   * Finds an NLP value by its ID and populates related entities.
   *
   * @param id The ID of the NLP value to find.
   *
   * @returns A promise that resolves with the populated NLP value.
   */
  async findOneAndPopulate(id: string) {
    return await this.repository.findOneAndPopulate(id);
  }

  /**
   * Finds a page of NLP values based on filters, and populates related entities.
   *
   * @param filters The filters to apply when searching for NLP values.
   * @param pageQuery Pagination information such as page number and size.
   *
   * @returns A promise that resolves with a page of populated NLP values.
   */
  async findPageAndPopulate(
    filters: TFilterQuery<NlpValue>,
    pageQuery: PageQueryDto<NlpValue>,
  ) {
    return await this.repository.findPageAndPopulate(filters, pageQuery);
  }

  /**
   * Adds new NLP values or updates existing ones based on the provided training sample.
   * This method handles both the creation of new values and the addition of synonyms.
   *
   * @param sampleText The original text from the training sample.
   * @param sampleEntities The entities and values extracted from the sample.
   * @param storedEntities The stored NLP entities to be updated with new values.
   *
   * @returns A promise that resolves with the updated sample entities containing their IDs.
   */
  async storeNewValues(
    sampleText: string,
    sampleEntities: NlpSampleEntityValue[],
    storedEntities: NlpEntity[],
  ) {
    const eMap: Record<string, NlpEntity> = storedEntities.reduce(
      (acc, curr) => {
        if (curr.name) acc[curr?.name] = curr;
        return acc;
      },
      {},
    );

    // Extract entity values from sampleEntities
    const values = sampleEntities.map((e) => e.value);

    // Retrieve stored values
    let storedValues = await this.find({
      value: {
        $in: values,
      },
    });

    // Compute the values to be added
    const valuesToAdd = sampleEntities
      // Remove already stored values
      .filter((e) => storedValues.findIndex((v) => v.value === e.value) === -1)
      // Filter unique values to avoid duplicates
      .filter(
        (e, idx, self) =>
          self.findIndex(({ value }) => e.value === value) === idx,
      )
      // Build the value dto object
      .map((e) => {
        const newValue: NlpValueCreateDto = {
          entity: eMap[e.entity].id,
          value: e.value,
          expressions: [],
        };
        // Deal with synonym case
        if ('start' in e && 'end' in e) {
          const word = sampleText.slice(e.start, e.end);
          if (word !== e.value) {
            newValue.expressions = [word];
          }
        }
        return newValue;
      });

    // Store new values
    const newValues = await this.createMany(valuesToAdd);

    storedValues = storedValues.concat(newValues);

    const vMap: Record<string, NlpValue> = storedValues.reduce((acc, curr) => {
      acc[curr.value] = curr;
      return acc;
    }, {});

    // Store new synonyms for existing values
    const synonymsToAdd = sampleEntities
      .filter((e) => {
        if ('start' in e && 'end' in e) {
          const word = sampleText.slice(e.start, e.end);
          return (
            word !== e.value && vMap[e.value].expressions.indexOf(word) === -1
          );
        }
        return false;
      })
      .map((e) => {
        return this.updateOne(vMap[e.value].id, {
          ...vMap[e.value],
          expressions: vMap[e.value].expressions.concat([
            sampleText.slice(e.start, e.end),
          ]),
        } as NlpValueUpdateDto);
      });

    await Promise.all(synonymsToAdd);

    // Replace entities/values with ids
    const result: NlpSampleEntityValue[] = sampleEntities.map((e) => {
      return {
        ...e,
        entity: eMap[e.entity].id,
        value: vMap[e.value].id,
      };
    });

    // Return sample entities with ids
    return result;
  }

  /**
   * Adds new NLP values or updates existing ones based on the training sample.
   * Handles the addition of synonyms and ensures that each value has the correct entity association.
   *
   * @param sampleText The original text from the training sample.
   * @param sampleEntities The entities and values extracted from the sample.
   *
   * @returns A promise that resolves with the stored NLP values.
   */
  async storeValues(
    sampleText: string,
    sampleEntities: NlpSampleEntityValue[],
  ): Promise<NlpValue[]> {
    const entities = sampleEntities.map((e) => e.entity);
    // Get all used entities from database
    const storedEntities = await this.nlpEntityService.find({
      name: { $in: entities },
    });

    // Prepare values objects for storage
    const valuesToAdd: NlpValueCreateDto[] = sampleEntities.map((e) => {
      let expressions: string[] = [];
      // Deal with synonym case
      if (
        'start' in e &&
        e.start &&
        e.start >= 0 &&
        'end' in e &&
        e.end &&
        e.end > 0
      ) {
        const word = sampleText.slice(e.start, e.end);
        if (word !== e.value) {
          expressions = [word];
        }
      }
      const storedEntity = storedEntities.find((se) => se.name === e.entity);
      if (!storedEntity) {
        throw new Error(`Unable to find the stored entity ${e.entity}`);
      }
      return {
        entity: storedEntity.id,
        value: e.value,
        expressions,
      };
    });
    // Find or create values
    const promises = valuesToAdd.map(async (v) => {
      const createdOrFound = await this.findOneOrCreate({ value: v.value }, v);
      // If value is found in database, then update it's synonyms
      const expressions = createdOrFound.expressions
        .concat(v.expressions) // Add new synonyms
        .filter((v, i, a) => a.indexOf(v) === i); // Filter unique values

      // Update expressions
      const result = await this.updateOne({ value: v.value }, { expressions });

      if (!result) throw new Error(`Unable to update NLP value ${v.value}`);

      return result;
    });
    return Promise.all(promises);
  }
}
