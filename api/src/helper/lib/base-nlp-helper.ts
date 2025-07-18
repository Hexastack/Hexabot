/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { escapeRegExp } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { LoggerService } from '@/logger/logger.service';
import {
  NlpEntity,
  NlpEntityDocument,
  NlpEntityFull,
} from '@/nlp/schemas/nlp-entity.schema';
import { NlpSample, NlpSampleFull } from '@/nlp/schemas/nlp-sample.schema';
import {
  NlpValue,
  NlpValueDocument,
  NlpValueFull,
} from '@/nlp/schemas/nlp-value.schema';
import { SettingService } from '@/setting/services/setting.service';

import { HelperService } from '../helper.service';
import { HelperName, HelperType, NLU } from '../types';

import BaseHelper from './base-helper';

// eslint-disable-next-line prettier/prettier
export default abstract class BaseNlpHelper<
  N extends HelperName = HelperName,
> extends BaseHelper<N> {
  protected readonly type: HelperType = HelperType.NLU;

  constructor(
    name: N,
    settingService: SettingService,
    helperService: HelperService,
    logger: LoggerService,
  ) {
    super(name, settingService, helperService, logger);
  }

  /**
   * Updates an entity
   *
   * @param entity - The updated entity
   *
   * @returns The updated entity otherwise an error
   */
  async updateEntity(entity: NlpEntity): Promise<NlpEntity> {
    return entity;
  }

  /**
   * Adds an entity
   *
   * @param entity - The entity to add
   * @returns The added entity otherwise an error
   */
  addEntity(_entity: NlpEntityDocument): Promise<string> {
    return new Promise((resolve, _reject) => {
      return resolve(uuidv4());
    });
  }

  /**
   * Deletes an entity
   *
   * @param entityId - The entity ID to delete
   *
   * @return The deleted entity otherwise an error
   */
  async deleteEntity(entityId: string): Promise<any> {
    return entityId;
  }

  /**
   * Update an entity value
   *
   * @param value - The updated update
   *
   * @returns The updated value otherwise it should throw an error
   */
  async updateValue(value: NlpValue): Promise<NlpValue> {
    return value;
  }

  /**
   * Adds an entity value
   *
   * @param value - The value to add
   *
   * @returns The added value otherwise it should throw an error
   */
  addValue(_value: NlpValueDocument): Promise<string> {
    return new Promise((resolve, _reject) => {
      return resolve(uuidv4());
    });
  }

  /**
   * Delete an entity value
   *
   * @param value - The value to delete
   *
   * @returns The deleted value otherwise an error
   */
  async deleteValue(value: NlpValueFull): Promise<NlpValueFull> {
    return value;
  }

  /**
   * Returns training dataset in NLP provider compatible format.
   * Can be overridden in child classes for custom formatting logic.
   *
   * @param samples - Sample to train
   * @param entities - All available entities
   *
   * @returns The formatted NLP training set
   */
  async format(
    samples: NlpSampleFull[],
    entities: NlpEntityFull[],
  ): Promise<Record<string, any>[] | Record<string, any>> {
    const entityMap = NlpEntity.getEntityMap(entities);
    const valueMap = NlpValue.getValueMap(
      NlpValue.getValuesFromEntities(entities),
    );
    const examples = samples
      .filter((s) => s.entities.length > 0)
      .map((s) => {
        const intent = s.entities.find(
          (e) => entityMap[e.entity].name === 'intent',
        );
        if (!intent) {
          throw new Error('Unable to find the `intent` nlp entity.');
        }
        const sampleEntities = s.entities
          .filter((e) => entityMap[<string>e.entity].name !== 'intent')
          .map((e) => {
            const res = {
              entity: entityMap[<string>e.entity].name,
              value: valueMap[<string>e.value].value,
            };
            if ('start' in e && 'end' in e) {
              Object.assign(res, {
                start: e.start,
                end: e.end,
              });
            }
            return res;
          })
          .concat({
            entity: 'language',
            value: s.language!.code,
          });

        return {
          text: s.text,
          intent: valueMap[intent.value].value,
          entities: sampleEntities,
        };
      });

    return examples;
  }

  /**
   * Perform training request
   *
   * @param samples - Samples to train
   * @param entities - All available entities
   *
   * @returns Training result
   */
  train?(samples: NlpSampleFull[], entities: NlpEntityFull[]): Promise<any>;

  /**
   * Perform evaluation request
   *
   * @param samples - Samples to evaluate
   * @param entities - All available entities
   *
   * @returns NLP evaluation result
   */
  evaluate?(samples: NlpSampleFull[], entities: NlpEntityFull[]): Promise<any>;

  /**
   * Delete/Forget a sample
   *
   * @param sample - The sample to delete/forget
   *
   * @returns The deleted sample otherwise an error
   */
  async forget?(sample: NlpSample): Promise<NlpSample> {
    return sample;
  }

  /**
   * Returns only the entities that have strong confidence (> than the threshold), can return an empty result
   *
   * @param nlp - The nlp provider parse returned result
   * @param threshold - Whenever to apply threshold filter or not
   *
   * @returns NLP Parsed entities
   */
  filterEntitiesByConfidence?(
    nlp: any,
    threshold: boolean,
  ): Promise<NLU.ParseEntities>;

  /**
   * Returns only the entities that have strong confidence (> than the threshold), can return an empty result
   *
   * @param text - The text to parse
   * @param threshold - Whenever to apply threshold filter or not
   * @param project - Whenever to request a specific model
   *
   * @returns NLP Parsed entities
   */
  abstract predict(
    text: string,
    threshold?: boolean,
    project?: string,
  ): Promise<NLU.ParseEntities>;
  /**
   * Builds a Unicode-aware regular expression to match a term as a whole word in NLU samples.
   *
   * This method uses Unicode property escapes and lookbehind/lookahead to ensure the term is not part of a larger word,
   * making it robust for non-Latin scripts (e.g., Arabic, Cyrillic, accented characters).
   *
   * @param term - The keyword or expression to match literally in the text.
   * @returns A RegExp that matches the term as a whole word, using Unicode boundaries.
   *
   * @notes
   * - The returned RegExp uses the 'gu' flags (global, unicode).
   * - The term is escaped to avoid regex injection.
   */
  private buildUnicodeRegexExpression(term: string): RegExp {
    const escapedTerm = escapeRegExp(term);
    return new RegExp(`(?<!\\p{L})${escapedTerm}(?!\\p{L})`, 'gui');
  }

  /**
   * Finds entities in a given text based on their values and synonyms.
   *
   * This function takes a string of text and an array of entities, where each entity contains a value
   * and a list of synonyms. It returns an array of objects, each representing an entity found in the text
   * along with its start and end positions.
   *
   * @param text - The input text to search for entities.
   * @param entities - An array of entities to search for, each containing a `value` and a list of `synonyms`.
   *
   * @returns An array of objects representing the found entities, with their `value`, `start`, and `end` positions.
   */
  public extractKeywordBasedSlots(
    text: string,
    entity: NlpEntityFull,
  ): NLU.ParseEntity[] {
    if (!entity.values?.length) {
      this.logger.warn('NLP entity has no values');
      return [];
    }

    return (entity.values
      .flatMap(({ value, expressions }) => {
        const allValues = [value, ...expressions];

        // Filter the terms that are found in the text
        return allValues
          .flatMap((term) => {
            const regex = this.buildUnicodeRegexExpression(term);
            const matches = [...text.matchAll(regex)];

            // Map matches to FoundEntity format
            return matches.map((match) => ({
              entity: entity.name,
              value,
              start: match.index!,
              end: match.index! + term.length,
              confidence: 1,
            }));
          })
          .shift();
      })
      .filter((v) => !!v) || []) as NLU.ParseEntity[];
  }

  /**
   * Finds entities in a given text based on regex patterns (stored in `value` field).
   *
   * @param text - Input text to evaluate.
   * @param entity - NlpEntityFull with regex values in `value` and optional metadata.
   * @returns An array of matched entities with value, position, and confidence.
   */
  public extractPatternBasedSlots(
    text: string,
    entity: NlpEntityFull,
  ): NLU.ParseEntity[] {
    if (!entity.values?.length) {
      this.logger.warn('NLP entity has no values');
      return [];
    }

    return (entity.values
      .flatMap((nlpValue) => {
        const pattern = nlpValue.metadata?.pattern;

        if (!pattern) {
          this.logger.error('Missing NLP regex pattern');
          return [];
        }

        let regex: RegExp;
        try {
          const shouldWrap = nlpValue.metadata?.wordBoundary;
          regex = new RegExp(
            shouldWrap ? `(?<!\\p{L})${pattern}(?!\\p{L})` : pattern,
            'gui',
          );
        } catch {
          this.logger.error('Invalid NLP regex pattern');
          return [];
        }

        const matches = [...text.matchAll(regex)];

        return matches.map((match) => {
          let value = match[0];

          // Apply preprocessing if needed
          if (nlpValue.metadata?.removeSpaces) {
            value = value.replace(/\s+/g, '');
          }

          if (nlpValue.metadata?.toLowerCase) {
            value = value.toLowerCase();
          }

          if (nlpValue.metadata?.stripDiacritics) {
            value = value.normalize('NFD').replace(/\p{Diacritic}/gu, '');
          }

          return {
            entity: entity.name,
            value,
            canonicalValue: nlpValue.value,
            start: match.index!,
            end: match.index! + match[0].length,
            confidence: 1,
          };
        });
      })
      .filter((v) => !!v) || []) as NLU.ParseEntity[];
  }

  /**
   * Extracts slot values from text based on the specified lookup strategy.
   *
   * This function supports deterministic slot filling by scanning the input text using either
   * keyword-based or pattern-based entity recognition, depending on the provided lookup strategy.
   *
   * - For `keywords`: It uses exact term and synonym matching with word boundaries.
   * - For `pattern`: It uses regular expressions defined in each entity value (stored in `value` field),
   *   optionally applying preprocessing such as `removeSpaces`, `lowercase`, and `stripDiacritics`.
   *
   * @param text - The input text from which to extract slot values.
   * @param entities - An array of NlpEntityFull objects, each containing slot values and metadata.
   *
   * @returns An array of `ParseEntity` objects containing the entity name, matched value, position, and confidence.
   */
  public runDeterministicSlotFilling(
    text: string,
    entities: NlpEntityFull[],
  ): NLU.ParseEntity[] {
    return entities.flatMap((e) => {
      if (e.lookups.includes('keywords')) {
        return this.extractKeywordBasedSlots(text, e);
      } else if (e.lookups.includes('pattern')) {
        return this.extractPatternBasedSlots(text, e);
      } else {
        return [];
      }
    });
  }
}
