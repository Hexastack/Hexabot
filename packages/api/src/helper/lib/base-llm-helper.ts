/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { LoggerService } from '@hexabot/logger';
import { SettingService } from '@hexabot/setting/services/setting.service';

import { AnyMessage } from '@/chat/types/message';

import { HelperService } from '../helper.service';
import { HelperName, HelperType, LLM } from '../types';

import BaseHelper from './base-helper';

export default abstract class BaseLlmHelper<
  N extends HelperName = HelperName,
> extends BaseHelper<N> {
  protected readonly type: HelperType = HelperType.LLM;

  constructor(
    name: N,
    settingService: SettingService,
    helperService: HelperService,
    logger: LoggerService,
  ) {
    super(name, settingService, helperService, logger);
  }

  /**
   * Generates a text response using LLM
   *
   * @param prompt - The input text from the user
   * @param model - The model to be used
   * @param systemPrompt - The input text from the system
   * @param extra - Extra options
   * @returns {Promise<string>} - The generated response from the LLM
   */
  abstract generateResponse(
    prompt: string,
    model: string,
    systemPrompt: string,
    extra?: any,
  ): Promise<string>;

  /**
   * Generates a structured response using LLM
   *
   * @param prompt - The input text from the user
   * @param model - The model to be used
   * @param systemPrompt - The input text from the system
   * @param schema - The OpenAPI data schema
   * @param extra - Extra options
   * @returns {Promise<string>} - The generated response from the LLM
   */
  generateStructuredResponse?<T>(
    prompt: string,
    model: string,
    systemPrompt: string,
    schema: LLM.ResponseSchema,
    extra?: any,
  ): Promise<T>;

  /**
   * Send a chat completion request with the conversation history.
   * You can use this same approach to start the conversation
   * using multi-shot or chain-of-thought prompting.
   *
   * @param prompt - The input text from the user
   * @param model - The model to be used
   * @param history - Array of messages
   * @param extra - Extra options
   * @returns {Promise<string>} - The generated response from the LLM
   */
  abstract generateChatCompletion(
    prompt: string,
    model: string,
    systemPrompt?: string,
    history?: AnyMessage[],
    extra?: any,
  ): Promise<string>;
}
