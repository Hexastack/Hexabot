/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import FormData from 'form-data';

import { HelperService } from '@/helper/helper.service';
import BaseNlpHelper from '@/helper/lib/base-nlp-helper';
import { NLU } from '@/helper/types';
import { LanguageService } from '@/i18n/services/language.service';
import { LoggerService } from '@/logger/logger.service';
import { NlpEntity, NlpEntityFull } from '@/nlp/schemas/nlp-entity.schema';
import { NlpSampleFull } from '@/nlp/schemas/nlp-sample.schema';
import { NlpValue } from '@/nlp/schemas/nlp-value.schema';
import { SettingService } from '@/setting/services/setting.service';
import { buildURL } from '@/utils/helpers/URL';

import { LUDWIG_NLU_HELPER_NAME } from './settings';
import { LudwigNluResultType, NlpParseResultType, RasaNlu } from './types';

@Injectable()
export default class LudwigNluHelper extends BaseNlpHelper<
  typeof LUDWIG_NLU_HELPER_NAME
> {
  constructor(
    settingService: SettingService,
    helperService: HelperService,
    logger: LoggerService,
    private readonly httpService: HttpService,
    private readonly languageService: LanguageService,
  ) {
    super(LUDWIG_NLU_HELPER_NAME, settingService, helperService, logger);
  }

  getPath() {
    return __dirname;
  }

  /**
   * Formats a set of NLP samples into the Rasa NLU-compatible training dataset format.
   *
   * @param samples - The NLP samples to format.
   * @param entities - The NLP entities available in the dataset.
   *
   * @returns The formatted Rasa NLU training dataset.
   */
  async format(
    samples: NlpSampleFull[],
    entities: NlpEntityFull[],
  ): Promise<RasaNlu.Dataset> {
    const entityMap = NlpEntity.getEntityMap(entities);
    const valueMap = NlpValue.getValueMap(
      NlpValue.getValuesFromEntities(entities),
    );

    const common_examples: RasaNlu.CommonExample[] = samples
      .filter((s) => s.entities.length > 0)
      .map((s) => {
        const intent = s.entities.find(
          (e) => entityMap[e.entity].name === 'intent',
        );
        if (!intent) {
          throw new Error('Unable to find the `intent` nlp entity.');
        }
        const sampleEntities: RasaNlu.ExampleEntity[] = s.entities
          .filter((e) => entityMap[<string>e.entity].name !== 'intent')
          .map((e) => {
            const res: RasaNlu.ExampleEntity = {
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
    const lookup_tables: RasaNlu.LookupTable[] = entities
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
      }, [] as RasaNlu.EntitySynonym[])
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
   * Perform a training request
   *
   * @param samples - Samples to train
   * @param entities - All available entities
   * @returns The training result
   */
  async train(
    samples: NlpSampleFull[],
    entities: NlpEntityFull[],
  ): Promise<any> {
    const nluData: RasaNlu.Dataset = await this.format(samples, entities);
    const settings = await this.getSettings();
    // Train samples
    return await this.httpService.axiosRef.post(
      buildURL(settings.endpoint, `/train`),
      nluData,
      {
        params: {
          token: settings.token,
        },
      },
    );
  }

  /**
   * Perform evaluation request
   *
   * @param samples - Samples to evaluate
   * @param entities - All available entities
   * @returns Evaluation results
   */
  async evaluate(
    samples: NlpSampleFull[],
    entities: NlpEntityFull[],
  ): Promise<any> {
    const settings = await this.getSettings();
    const nluTestData: RasaNlu.Dataset = await this.format(samples, entities);
    // Evaluate model with test samples
    return await this.httpService.axiosRef.post(
      buildURL(settings.endpoint, `/evaluate`),
      nluTestData,
      {
        params: {
          token: settings.token,
        },
      },
    );
  }

  async process_incoming_nlu_payload(
    nlp: LudwigNluResultType,
    givenText: string,
  ): Promise<NlpParseResultType> {
    const words = givenText.split(' ');

    const intentValue = nlp.intent.predictions.intent_predictions;
    const intentKey = `intent_probabilities_${intentValue}`; // e.g., "intent_probabilities_greeting"
    const intentConfidence = nlp.intent.predictions[intentKey];
    const formattedIntentPayload = {
      name: intentValue,
      confidence: intentConfidence,
    };

    const languageValue = nlp.language.predictions.language_predictions;
    const languageKey = `language_probabilities_${languageValue}`;
    const languageConfidence: number = nlp.language.predictions[languageKey];
    const formattedLanguagePayload = {
      entity: 'language',
      value: languageValue,
      confidence: languageConfidence,
    };

    const slotsValues = nlp.slots.predictions.slots_predictions;
    const slotsProbabilities = nlp.slots.predictions.slots_probabilities;

    const restoredEntities = slotsValues
      .map((entity, index) => ({
        entity: entity.startsWith('B-') ? entity.slice(2) : entity, // Format token by removing 'B-' prefix
        //@ TODO add extra post processing steps for fetching the appropriate synonym
        value: words[index - 1], // Align with the word index (adjusting for <SOS>)
        confidence: slotsProbabilities[index],
      }))
      .filter(
        (item) =>
          item.entity !== '<SOS>' &&
          item.entity !== '<EOS>' &&
          item.entity !== 'O',
      ); // Filter unwanted tokens

    restoredEntities.push(formattedLanguagePayload);

    return {
      text: givenText,
      intent: formattedIntentPayload,
      entities: restoredEntities,
      intent_ranking: [],
    };
  }

  /**
   * Returns only the entities that have strong confidence (> than the threshold), can return an empty result
   *
   * @param nlp - The nlp returned result
   * @param threshold - Whenever to apply threshold filter or not
   *
   * @returns The parsed entities
   */
  async filterEntitiesByConfidence(
    nlp: NlpParseResultType,
    threshold: boolean,
  ): Promise<NLU.ParseEntities> {
    try {
      let minConfidence = 0;
      const guess: NLU.ParseEntities = {
        entities: nlp.entities.slice(),
      };
      if (threshold) {
        const settings = await this.getSettings();
        const threshold = settings.threshold;
        minConfidence =
          typeof threshold === 'string'
            ? Number.parseFloat(threshold)
            : threshold;
        guess.entities = guess.entities
          .map((e) => {
            e.confidence =
              typeof e.confidence === 'string'
                ? Number.parseFloat(e.confidence)
                : e.confidence;
            return e;
          })
          .filter((e) => e.confidence >= minConfidence);
        // Get past threshold and the highest confidence for the same entity
        // .filter((e, idx, self) => {
        //   const sameEntities = self.filter((s) => s.entity === e.entity);
        //   const max = Math.max.apply(Math, sameEntities.map((e) => { return e.confidence; }));
        //   return e.confidence === max;
        // });
      }

      ['intent', 'language'].forEach((trait) => {
        if (trait in nlp && (nlp as any)[trait].confidence >= minConfidence) {
          guess.entities.push({
            entity: trait,
            value: (nlp as any)[trait].name,
            confidence: (nlp as any)[trait].confidence,
          });
        }
      });
      return guess;
    } catch (e) {
      this.logger.error(
        'Core NLU Helper : Unable to parse nlp result to extract best guess!',
        e,
      );
      return {
        entities: [],
      };
    }
  }

  /**
   * Returns only the entities that have strong confidence (> than the threshold), can return an empty result
   *
   * @param text - The text to parse
   * @param threshold - Whenever to apply threshold filter or not
   * @returns The prediction
   */
  async predict(text: string, threshold: boolean): Promise<NLU.ParseEntities> {
    try {
      const settings = await this.getSettings();
      const form = new FormData();
      form.append('text', text);

      const requestConfig = {
        headers: {
          ...form.getHeaders(), // Automatically includes Content-Type with the boundary
        },
        params: {
          token: settings.token,
        },
      };

      const { data: nlp } =
        await this.httpService.axiosRef.post<LudwigNluResultType>(
          buildURL(settings.endpoint, '/predict'),
          form, // Pass the form-data object directly
          requestConfig,
        );

      const formattedNlp = await this.process_incoming_nlu_payload(nlp, text);
      return await this.filterEntitiesByConfidence(formattedNlp, threshold);
    } catch (err) {
      this.logger.error('Core NLU Helper : Unable to parse nlp', err);
      throw err;
    }
  }
}
