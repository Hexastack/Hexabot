/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';

import { BaseService } from '@/utils/generics/base-service';

import { NlpSampleEntityCreateDto } from '../dto/nlp-sample-entity.dto';
import { NlpSampleEntityRepository } from '../repositories/nlp-sample-entity.repository';
import {
  NlpSampleEntity,
  NlpSampleEntityFull,
  NlpSampleEntityPopulate,
} from '../schemas/nlp-sample-entity.schema';
import { NlpSample, NlpSampleStub } from '../schemas/nlp-sample.schema';
import { NlpValue } from '../schemas/nlp-value.schema';
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

  /**
   * Extracts entities from a given text sample by matching keywords defined in `NlpValue`.
   * The function uses regular expressions to locate each keyword and returns an array of matches.
   *
   * @param sample - The text sample from which entities should be extracted.
   * @param value - The entity value containing the primary keyword and its expressions.
   * @returns - An array of extracted entity matches, including their positions.
   */
  extractKeywordEntities<S extends NlpSampleStub>(
    sample: S,
    value: NlpValue,
  ): NlpSampleEntityCreateDto[] {
    const keywords = [value.value, ...value.expressions];
    const regex = `(?<!\\p{L})${keywords.join('|')}(?!\\p{L})`;
    const regexPattern = new RegExp(regex, 'giu');
    const matches: NlpSampleEntityCreateDto[] = [];
    let match: RegExpExecArray | null;

    // Find all matches in the text using the regex pattern
    while ((match = regexPattern.exec(sample.text)) !== null) {
      matches.push({
        sample: sample.id,
        entity: value.entity,
        value: value.id,
        start: match.index,
        end: match.index + match[0].length,
      });

      // Prevent infinite loops when using a regex with an empty match
      if (match.index === regexPattern.lastIndex) {
        regexPattern.lastIndex++;
      }
    }

    return matches;
  }
}
