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
import { LudwigNlu } from './types';

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
  ): Promise<LudwigNlu.LudwigNluDataSample[]> {
    const entityMap = NlpEntity.getEntityMap(entities);
    const valueMap = NlpValue.getValueMap(
      NlpValue.getValuesFromEntities(entities),
    );

    const dataset: LudwigNlu.LudwigNluDataSample[] = samples
      .filter((s) => s.entities.length > 0)
      .map((s) => {
        const traitEntities = s.entities.filter((e) =>
          entityMap[e.entity]?.lookups.includes('trait'),
        );

        if (traitEntities.length === 0) {
          throw new Error('Unable to find any `trait` nlp entities.');
        }

        const sampleEntities: LudwigNlu.ExampleEntity[] = s.entities
          .filter(
            (e) => !entityMap[<string>e.entity]?.lookups.includes('trait'),
          )
          .map((e) => {
            const res: LudwigNlu.ExampleEntity = {
              entity: entityMap[<string>e.entity].name || '',
              value: valueMap[<string>e.value]?.value || '',
            };
            if ('start' in e && 'end' in e) {
              Object.assign(res, {
                start: e.start,
                end: e.end,
              });
            }
            return res;
          });

        const formattedSlots = this.formatSlots(s.text, sampleEntities);

        // Flatten traits into individual key-value pairs
        const flattenedTraits = traitEntities.reduce(
          (acc, t) => {
            const traitName = entityMap[t.entity]?.name || 'unknown_trait';
            acc[traitName] = valueMap[t.value]?.value || '';
            return acc;
          },
          {} as Record<string, string>,
        );
        return {
          text: s.text,
          language: s.language.code,
          slots: formattedSlots,
          ...flattenedTraits, // Spread the flattened traits into the object
        };
      });

    return dataset;
  }

  private formatSlots(
    text: string,
    entities: LudwigNlu.ExampleEntity[],
  ): string {
    const words = text.split(/\s+/);

    // Initialize the slots array with 'O' tags
    const slots = Array(words.length).fill('O');

    // Track the current character position in the original text
    let currentPosition = 0;

    // Iterate over the words and map them to slots using entity indices
    words.forEach((word, index) => {
      // Calculate the start and end indices of the current word
      const wordStart = currentPosition;
      const wordEnd = currentPosition + word.length;

      // Look for a matching entity whose indices overlap the current word
      const matchingEntity = entities.find(
        (e) => e.start < wordEnd && e.end > wordStart, // Check for overlap
      );

      if (matchingEntity) {
        slots[index] = `B-${matchingEntity.entity}`;
      }

      // Update the current position (account for the space after the word)
      currentPosition = wordEnd + 1;
    });

    const formattedSlots = slots.join(' ');
    return formattedSlots;
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
    throw new Error('Method not Implemented yet');
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
    throw new Error('Method Not Implemented Yet');
  }

  async processIncomingNluPayload<T>(
    nlp: LudwigNlu.LudwigNluResultType<T>,
    givenText: string,
  ): Promise<LudwigNlu.NluProcessedResultType> {
    const words = givenText.split(' ');

    // Dynamically get all keys from nlp excluding 'language' and 'slots'
    const fields = Object.keys(nlp).filter(
      (field) => field !== 'language' && field !== 'slots',
    );

    const formattedPayloads = fields.map((field) => {
      const predictions = nlp[field]?.predictions || {};
      const keyToRestore = `${field}_predictions`;
      const traitValue = predictions[keyToRestore];
      const traitKey = `${field}_probabilities_${traitValue}`;
      const traitConfidence = predictions[traitKey];
      return {
        [field]: {
          name: traitValue,
          confidence: traitConfidence,
        },
      };
    });

    // Process language
    const languageValue = nlp.language.predictions.language_predictions;
    const languageKey = `language_probabilities_${languageValue}`;
    const languageConfidence = nlp.language.predictions[languageKey];
    const formattedLanguagePayload = {
      entity: 'language',
      value: languageValue,
      confidence: languageConfidence,
    };

    // Process slots
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
      ...Object.assign({}, ...formattedPayloads), // Merge formattedPayloads dynamically
      entities: restoredEntities,
      intent_ranking: [], // Optional: Populate intent rankings if needed
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
    nlp: LudwigNlu.NluProcessedResultType,
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
        'Ludwig NLU Helper : Unable to parse nlp result to extract best guess!',
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

      const { data: nlp } = await this.httpService.axiosRef.post<
        LudwigNlu.LudwigNluResultType<any>
      >(
        buildURL(settings.endpoint, '/predict'),
        form, // Pass the form-data object directly
        requestConfig,
      );

      const formattedNlp = await this.processIncomingNluPayload(nlp, text);
      return await this.filterEntitiesByConfidence(formattedNlp, threshold);
    } catch (err) {
      this.logger.error('Ludwig NLU Helper : Unable to parse nlp', err);
      throw err;
    }
  }
}
