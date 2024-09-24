/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import {
  CommonExample,
  DatasetType,
  EntitySynonym,
  ExampleEntity,
  LookupTable,
} from '@/extensions/helpers/nlp/default/types';
import { Language } from '@/i18n/schemas/language.schema';
import { LanguageService } from '@/i18n/services/language.service';
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
  constructor(
    readonly repository: NlpSampleRepository,
    private readonly languageService: LanguageService,
  ) {
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
  async formatRasaNlu(
    samples: NlpSampleFull[],
    entities: NlpEntityFull[],
  ): Promise<DatasetType> {
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
          })
          // TODO : place language at the same level as the intent
          .concat({
            entity: 'language',
            value: s.language.code,
          });

        return {
          text: s.text,
          intent: valueMap[intent.value].value,
          entities: sampleEntities,
        };
      });

    const languages = await this.languageService.getLanguages();
    const lookup_tables: LookupTable[] = entities
      .map((e) => {
        return {
          name: e.name,
          elements: e.values.map((v) => {
            return v.value;
          }),
        };
      })
      .concat({
        name: 'language',
        elements: Object.keys(languages),
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

  /**
   * When a language gets deleted, we need to set related samples to null
   *
   * @param language The language that has been deleted.
   */
  @OnEvent('hook:language:delete')
  async handleLanguageDelete(language: Language) {
    await this.updateMany(
      {
        language: language.id,
      },
      {
        language: null,
      },
    );
  }
}
