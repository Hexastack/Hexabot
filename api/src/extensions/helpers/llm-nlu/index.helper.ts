/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import Handlebars from 'handlebars';

import { HelperService } from '@/helper/helper.service';
import BaseNlpHelper from '@/helper/lib/base-nlp-helper';
import { LLM, NLU } from '@/helper/types';
import { LanguageService } from '@/i18n/services/language.service';
import { LoggerService } from '@/logger/logger.service';
import { NlpEntityFull } from '@/nlp/schemas/nlp-entity.schema';
import { NlpEntityService } from '@/nlp/services/nlp-entity.service';
import { SettingService } from '@/setting/services/setting.service';

import { LLM_NLU_HELPER_NAME } from './settings';

@Injectable()
export default class LlmNluHelper
  extends BaseNlpHelper<typeof LLM_NLU_HELPER_NAME>
  implements OnModuleInit
{
  private languageClassifierPrompt: string;

  /**
   * Trait prompts dictionary by id
   */
  private traitClassifierPrompts: Array<NlpEntityFull & { prompt: string }>;

  constructor(
    settingService: SettingService,
    helperService: HelperService,
    logger: LoggerService,
    private readonly languageService: LanguageService,
    private readonly nlpEntityService: NlpEntityService,
  ) {
    super(LLM_NLU_HELPER_NAME, settingService, helperService, logger);
  }

  getPath() {
    return __dirname;
  }

  @OnEvent('hook:language:*')
  @OnEvent('hook:llm_nlu_helper:language_classifier_prompt_template')
  async buildLanguageClassifierPrompt() {
    const settings = await this.getSettings();
    if (settings) {
      const languages = await this.languageService.findAll();
      const delegate = Handlebars.compile(
        settings.language_classifier_prompt_template,
      );
      this.languageClassifierPrompt = delegate({ languages });
    }
  }

  @OnEvent('hook:nlpEntity:*')
  @OnEvent('hook:nlpValue:*')
  @OnEvent('hook:llm_nlu_helper:trait_classifier_prompt_template')
  async buildClassifiersPrompt() {
    const settings = await this.getSettings();
    if (settings) {
      const entities = await this.nlpEntityService.findAndPopulate({
        lookups: 'trait',
      });
      const traitEntities = entities.filter(({ lookups }) =>
        lookups.includes('trait'),
      );
      this.traitClassifierPrompts = traitEntities.map((entity) => ({
        ...entity,
        prompt: Handlebars.compile(settings.trait_classifier_prompt_template)({
          entity,
        }),
      }));
    }
  }

  async onModuleInit() {
    super.onModuleInit();

    await this.buildLanguageClassifierPrompt();
    await this.buildClassifiersPrompt();
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
  private findKeywordEntities(text: string, entity: NlpEntityFull) {
    return (
      entity.values
        .flatMap(({ value, expressions }) => {
          const allValues = [value, ...expressions];

          // Filter the terms that are found in the text
          return allValues
            .flatMap((term) => {
              const regex = new RegExp(`\\b${term}\\b`, 'g');
              const matches = [...text.matchAll(regex)];

              // Map matches to FoundEntity format
              return matches.map((match) => ({
                entity: entity.name,
                value: term,
                start: match.index!,
                end: match.index! + term.length,
                confidence: 1,
              }));
            })
            .shift();
        })
        .filter((v) => !!v) || []
    );
  }

  async predict(text: string): Promise<NLU.ParseEntities> {
    const settings = await this.getSettings();
    const helper = await this.helperService.getDefaultLlmHelper();
    const defaultLanguage = await this.languageService.getDefaultLanguage();
    // Detect language
    const language = await helper.generateStructuredResponse<string>?.(
      `input text: ${text}`,
      settings.model,
      this.languageClassifierPrompt,
      {
        type: LLM.ResponseSchemaType.STRING,
        description: 'Language of the input text',
      },
    );

    const traits: NLU.ParseEntity[] = [
      {
        entity: 'language',
        value: language || defaultLanguage.code,
        confidence: 100,
      },
    ];
    for await (const { name, doc, prompt, values } of this
      .traitClassifierPrompts) {
      const allowedValues = values.map(({ value }) => value);
      const result = await helper.generateStructuredResponse<string>?.(
        `input text: ${text}`,
        settings.model,
        prompt,
        {
          type: LLM.ResponseSchemaType.STRING,
          description: `${name}${doc ? `: ${doc}` : ''}`,
          enum: allowedValues.concat('unknown'),
        },
      );
      const safeValue = result?.toLowerCase().trim();
      const value =
        safeValue && allowedValues.includes(safeValue) ? safeValue : '';
      traits.push({
        entity: name,
        value,
        confidence: 100,
      });
    }

    // Perform slot filling in a deterministic way since
    // it's currently a challenging task for the LLMs.
    const keywordEntities = await this.nlpEntityService.findAndPopulate({
      lookups: 'keywords',
    });
    const entities = keywordEntities.flatMap((keywordEntity) =>
      this.findKeywordEntities(text, keywordEntity),
    ) as NLU.ParseEntity[];

    return { entities: traits.concat(entities) };
  }
}
