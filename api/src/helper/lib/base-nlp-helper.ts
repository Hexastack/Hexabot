/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

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
}
