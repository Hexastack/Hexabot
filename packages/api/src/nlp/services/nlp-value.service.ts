/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { FindManyOptions, In } from 'typeorm';

import { NlpValueMatchPattern } from '@/chat/schemas/types/pattern';
import { BaseOrmService } from '@/utils/generics/base-orm.service';
import { DeleteResult } from '@/utils/generics/base-repository';
import { Format } from '@/utils/types/format.types';

import { NlpSampleEntityValue } from '..//types';
import { NlpEntity } from '../dto/nlp-entity.dto';
import {
  NlpValue,
  NlpValueCreateDto,
  NlpValueDto,
  NlpValueTransformerDto,
  TNlpValueCount,
} from '../dto/nlp-value.dto';
import { NlpValueOrmEntity } from '../entities/nlp-value.entity';
import { NlpValueRepository } from '../repositories/nlp-value.repository';

import { NlpEntityService } from './nlp-entity.service';

@Injectable()
export class NlpValueService extends BaseOrmService<
  NlpValueOrmEntity,
  NlpValueTransformerDto,
  NlpValueDto
> {
  constructor(
    readonly repository: NlpValueRepository,
    @Inject(forwardRef(() => NlpEntityService))
    private readonly nlpEntityService: NlpEntityService,
  ) {
    super(repository);
  }

  /**
   * Fetch values whose `value` field matches the patterns provided.
   *
   * @param patterns  Pattern list
   * @returns Promise resolving to the matching values.
   */
  async findByPatterns(patterns: NlpValueMatchPattern[]) {
    return await this.find({
      where: {
        value: In(patterns.map((p) => p.value)),
      },
    });
  }

  /**
   * Deletes an NLP value by its ID, cascading any dependent data.
   *
   * @param id The ID of the NLP value to delete.
   *
   * @returns A promise that resolves when the deletion is complete.
   */
  async deleteCascadeOne(id: string): Promise<DeleteResult> {
    return await this.repository.deleteOne(id);
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
  ): Promise<NlpSampleEntityValue[]> {
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
      where: { value: In(values) },
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
            word !== e.value && vMap[e.value].expressions?.indexOf(word) === -1
          );
        }
        return false;
      })
      .map((e) => {
        const value = vMap[e.value];
        const expression = sampleText.slice(e.start, e.end);
        return this.updateOne(value.id, {
          expressions: [...(value.expressions ?? []), expression],
        });
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
      where: { name: In(entities) },
    });

    // Prepare values objects for storage
    const valuesToAddMap = new Map<string, NlpValueCreateDto>();
    for (const entityValue of sampleEntities) {
      let expressions: string[] = [];
      if (
        'start' in entityValue &&
        entityValue.start &&
        entityValue.start >= 0 &&
        'end' in entityValue &&
        entityValue.end &&
        entityValue.end > 0
      ) {
        const word = sampleText.slice(entityValue.start, entityValue.end);
        if (word !== entityValue.value) {
          expressions = [word];
        }
      }

      const storedEntity = storedEntities.find(
        (se) => se.name === entityValue.entity,
      );
      if (!storedEntity) {
        throw new Error(
          `Unable to find the stored entity ${entityValue.entity}`,
        );
      }

      const existing = valuesToAddMap.get(entityValue.value);
      if (existing) {
        const mergedExpressions = new Set([
          ...(existing.expressions ?? []),
          ...expressions,
        ]);
        existing.expressions = mergedExpressions.size
          ? Array.from(mergedExpressions)
          : undefined;
      } else {
        valuesToAddMap.set(entityValue.value, {
          entity: storedEntity.id,
          value: entityValue.value,
          expressions: expressions.length ? expressions : undefined,
        });
      }
    }

    const valuesToAdd = Array.from(valuesToAddMap.values());
    // Find or create values
    const promises = valuesToAdd.map(async (v) => {
      const createdOrFound = await this.findOneOrCreate(
        { where: { value: v.value } },
        v,
      );
      // If value is found in database, then update it's synonyms
      const expressions = v.expressions
        ? createdOrFound.expressions
            ?.concat(v.expressions) // Add new synonyms
            .filter((v, i, a) => a.indexOf(v) === i)
        : createdOrFound.expressions?.filter((v, i, a) => a.indexOf(v) === i); // Filter unique values

      // Update expressions
      const result = await this.updateOne(
        { where: { value: v.value } },
        { expressions },
      );

      if (!result) throw new Error(`Unable to update NLP value ${v.value}`);

      return result;
    });
    return Promise.all(promises);
  }

  /**
   * Retrieves NLP values with their training sample counts from the repository,
   * applying pagination, filters, and formatting.
   * @param format - Desired result format: FULL or STUB.
   * @param options - TypeORM find options to control filtering, sorting, and pagination.
   * @returns A promise that resolves to a list of NLP values with their training sample counts,
   *          typed according to the requested format.
   */
  async findWithCount<F extends Format>(
    format: F,
    options: FindManyOptions<NlpValueOrmEntity> = {},
  ): Promise<TNlpValueCount<F>[]> {
    return await this.repository.findWithCount(format, options);
  }
}
