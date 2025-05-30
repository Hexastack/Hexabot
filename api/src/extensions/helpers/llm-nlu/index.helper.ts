/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import Handlebars from 'handlebars';

import { AppInstance } from '@/app.instance';
import { HelperService } from '@/helper/helper.service';
import BaseNlpHelper from '@/helper/lib/base-nlp-helper';
import { HelperType, LLM, NLU } from '@/helper/types';
import { LanguageService } from '@/i18n/services/language.service';
import { LoggerService } from '@/logger/logger.service';
import { NlpEntityFull } from '@/nlp/schemas/nlp-entity.schema';
import { NlpEntityService } from '@/nlp/services/nlp-entity.service';
import { SettingService } from '@/setting/services/setting.service';

import { LLM_NLU_HELPER_NAME } from './settings';

@Injectable()
export default class LlmNluHelper
  extends BaseNlpHelper<typeof LLM_NLU_HELPER_NAME>
  implements OnApplicationBootstrap
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
    try {
      const settings = await this.getSettings();
      const languages = await this.languageService.findAll();
      const delegate = Handlebars.compile(
        settings.language_classifier_prompt_template,
      );
      this.languageClassifierPrompt = delegate({ languages });
    } catch (error) {
      this.logger.warn(
        'Settings for LLM NLU helper not found or invalid, language classifier prompt will not be built.',
        error,
      );
    }
  }

  @OnEvent('hook:nlpEntity:*')
  @OnEvent('hook:nlpValue:*')
  @OnEvent('hook:llm_nlu_helper:trait_classifier_prompt_template')
  async buildClassifiersPrompt() {
    try {
      const settings = await this.getSettings();
      const traitEntities = await this.nlpEntityService.findAndPopulate({
        lookups: 'trait',
      });
      this.traitClassifierPrompts = traitEntities.map((entity) => ({
        ...entity,
        prompt: Handlebars.compile(settings.trait_classifier_prompt_template)({
          entity,
        }),
      }));
    } catch (error) {
      this.logger.warn(
        'Settings for LLM NLU helper not found or invalid, trait classifier prompts will not be built.',
        error,
      );
    }
  }

  async onApplicationBootstrap() {
    if (!AppInstance.isReady()) {
      // bypass in Test / CLI env
      return;
    }

    try {
      this.logger.log('Initializing LLM NLU helper, building prompts...');
      // Build prompts for language and trait classifiers
      // This is done on application bootstrap to ensure that the settings are loaded
      // and the prompts are built before any requests are made to the helper.
      await this.buildLanguageClassifierPrompt();
      await this.buildClassifiersPrompt();
    } catch (error) {
      this.logger.error('Unable to initialize LLM NLU helper', error);
    }
  }

  async predict(text: string): Promise<NLU.ParseEntities> {
    const settings = await this.getSettings();
    const helper = await this.helperService.getDefaultHelper(HelperType.LLM);
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
        confidence: 1,
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
        confidence: 1,
      });
    }

    // Perform slot filling in a deterministic way since
    // it's currently a challenging task for the LLMs.
    const entities = await this.nlpEntityService.getNlpEntitiesByLookup([
      'keywords',
      'pattern',
    ]);

    const slotEntities = this.runDeterministicSlotFilling(text, entities);

    return { entities: traits.concat(slotEntities) };
  }
}
