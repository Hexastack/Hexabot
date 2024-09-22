/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Injectable } from '@nestjs/common';

import {
  CommonExample,
  DatasetType,
  EntitySynonym,
  ExampleEntity,
  LookupTable,
} from '@/extensions/helpers/nlp/default/types';
import { BaseService } from '@/utils/generics/base-service';

import { NlpSampleRepository } from '../repositories/nlp-sample.repository';
import { NlpEntity, NlpEntityFull } from '../schemas/nlp-entity.schema';
import {
  NlpSample,
  NlpSampleFull,
  NlpSamplePopulate,
} from '../schemas/nlp-sample.schema';
import { NlpValue } from '../schemas/nlp-value.schema';

@Injectable()
export class NlpSampleService extends BaseService<
  NlpSample,
  NlpSamplePopulate,
  NlpSampleFull
> {
  constructor(readonly repository: NlpSampleRepository) {
    super(repository);
  }

  /**
   * Deletes an NLP sample by its ID and cascades the operation if needed.
   *
   * @param id - The unique identifier of the NLP sample to delete.
   *
   * @returns A promise resolving when the sample is deleted.
   */
  async deleteCascadeOne(id: string) {
    return await this.repository.deleteOne(id);
  }

  /**
   * Formats a set of NLP samples into the Rasa NLU-compatible training dataset format.
   *
   * @param samples - The NLP samples to format.
   * @param entities - The NLP entities available in the dataset.
   *
   * @returns The formatted Rasa NLU training dataset.
   */
  formatRasaNlu(
    samples: NlpSampleFull[],
    entities: NlpEntityFull[],
  ): DatasetType {
    const entityMap = NlpEntity.getEntityMap(entities);
    const valueMap = NlpValue.getValueMap(
      NlpValue.getValuesFromEntities(entities),
    );

    const common_examples: CommonExample[] = samples
      .filter((s) => s.entities.length > 0)
      .map((s) => {
        const intent = s.entities.find(
          (e) => entityMap[e.entity].name === 'intent',
        );
        if (!intent) {
          throw new Error('Unable to find the `intent` nlp entity.');
        }
        const sampleEntities: ExampleEntity[] = s.entities
          .filter((e) => entityMap[<string>e.entity].name !== 'intent')
          .map((e) => {
            const res: ExampleEntity = {
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
          });
        return {
          text: s.text,
          intent: valueMap[intent.value].value,
          entities: sampleEntities,
        };
      });
    const lookup_tables: LookupTable[] = entities.map((e) => {
      return {
        name: e.name,
        elements: e.values.map((v) => {
          return v.value;
        }),
      };
    });
    const entity_synonyms = entities
      .reduce((acc, e) => {
        const synonyms = e.values.map((v) => {
          return {
            value: v.value,
            synonyms: v.expressions,
          };
        });
        return acc.concat(synonyms);
      }, [] as EntitySynonym[])
      .filter((s) => {
        return s.synonyms.length > 0;
      });
    return {
      common_examples,
      regex_features: [],
      lookup_tables,
      entity_synonyms,
    };
  }
}
