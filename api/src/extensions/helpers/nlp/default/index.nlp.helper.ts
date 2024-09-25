/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

import { LoggerService } from '@/logger/logger.service';
import BaseNlpHelper from '@/nlp/lib/BaseNlpHelper';
import { Nlp } from '@/nlp/lib/types';
import { NlpEntityFull } from '@/nlp/schemas/nlp-entity.schema';
import { NlpSampleFull } from '@/nlp/schemas/nlp-sample.schema';
import { NlpEntityService } from '@/nlp/services/nlp-entity.service';
import { NlpSampleService } from '@/nlp/services/nlp-sample.service';
import { NlpService } from '@/nlp/services/nlp.service';
import { buildURL } from '@/utils/helpers/URL';

import { DatasetType, NlpParseResultType } from './types';

@Injectable()
export default class DefaultNlpHelper extends BaseNlpHelper {
  /**
   * Instantiate a nlp helper
   *
   * @param settings - NLP settings
   */
  constructor(
    logger: LoggerService,
    nlpService: NlpService,
    nlpSampleService: NlpSampleService,
    nlpEntityService: NlpEntityService,
    protected readonly httpService: HttpService,
  ) {
    super(logger, nlpService, nlpSampleService, nlpEntityService);
  }

  onModuleInit() {
    this.nlpService.setHelper(this.getName(), this);
  }

  getName() {
    return 'default';
  }

  /**
   * Return training dataset in compatible format
   *
   * @param samples - Sample to train
   * @param entities - All available entities
   * @returns {DatasetType} - The formatted RASA training set
   */
  async format(
    samples: NlpSampleFull[],
    entities: NlpEntityFull[],
  ): Promise<DatasetType> {
    const nluData = await this.nlpSampleService.formatRasaNlu(
      samples,
      entities,
    );

    return nluData;
  }

  /**
   * Perform Rasa training request
   *
   * @param samples - Samples to train
   * @param entities - All available entities
   * @returns {Promise<any>} - Rasa training result
   */
  async train(
    samples: NlpSampleFull[],
    entities: NlpEntityFull[],
  ): Promise<any> {
    const self = this;
    const nluData: DatasetType = await self.format(samples, entities);
    // Train samples
    const result = await this.httpService.axiosRef.post(
      buildURL(this.settings.endpoint, `/train`),
      nluData,
      {
        params: {
          token: this.settings.token,
        },
      },
    );
    // Mark samples as trained
    await this.nlpSampleService.updateMany(
      { type: 'train' },
      { trained: true },
    );
    return result;
  }

  /**
   * Perform evaluation request
   *
   * @param samples - Samples to evaluate
   * @param entities - All available entities
   * @returns {Promise<any>} - Evaluation results
   */
  async evaluate(
    samples: NlpSampleFull[],
    entities: NlpEntityFull[],
  ): Promise<any> {
    const self = this;
    const nluTestData: DatasetType = await self.format(samples, entities);
    // Evaluate model with test samples
    return await this.httpService.axiosRef.post(
      buildURL(this.settings.endpoint, `/evaluate`),
      nluTestData,
      {
        params: {
          token: this.settings.token,
        },
      },
    );
  }

  /**
   * Returns only the entities that have strong confidence (> than the threshold), can return an empty result
   *
   * @param nlp - The nlp returned result
   * @param threshold - Whenever to apply threshold filter or not
   * @returns {Nlp.ParseEntities}
   */
  bestGuess(nlp: NlpParseResultType, threshold: boolean): Nlp.ParseEntities {
    try {
      let minConfidence = 0;
      const guess: Nlp.ParseEntities = {
        entities: nlp.entities.slice(),
      };
      if (threshold) {
        minConfidence = Number.parseFloat(this.settings.threshold);
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
        'NLP RasaAdapter : Unable to parse nlp result to extract best guess!',
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
   * @param project - Whenever to request a specific model
   * @returns {Promise<Nlp.ParseEntities>}
   */
  async parse(
    text: string,
    threshold: boolean,
    project: string = 'current',
  ): Promise<Nlp.ParseEntities> {
    try {
      const { data: nlp } =
        await this.httpService.axiosRef.post<NlpParseResultType>(
          buildURL(this.settings.endpoint, '/parse'),
          {
            q: text,
            project,
          },
          {
            params: {
              token: this.settings.token,
            },
          },
        );

      return this.bestGuess(nlp, threshold);
    } catch (err) {
      this.logger.error('NLP RasaAdapter : Unable to parse nlp', err);
      throw err;
    }
  }
}
