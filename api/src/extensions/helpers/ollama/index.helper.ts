/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Ollama } from 'ollama';

import { AnyMessage } from '@/chat/schemas/types/message';
import { HelperService } from '@/helper/helper.service';
import BaseLlmHelper from '@/helper/lib/base-llm-helper';
import { LoggerService } from '@/logger/logger.service';
import { Setting } from '@/setting/schemas/setting.schema';
import { SettingService } from '@/setting/services/setting.service';

import { OLLAMA_HELPER_NAME, OLLAMA_HELPER_SETTINGS } from './settings';

@Injectable()
export default class OllamaLlmHelper
  extends BaseLlmHelper<typeof OLLAMA_HELPER_NAME>
  implements OnApplicationBootstrap
{
  private client: Ollama;

  /**
   * Instantiate the LLM helper
   *
   * @param logger - Logger service
   */
  constructor(
    settingService: SettingService,
    helperService: HelperService,
    protected readonly logger: LoggerService,
  ) {
    super(
      OLLAMA_HELPER_NAME,
      OLLAMA_HELPER_SETTINGS,
      settingService,
      helperService,
      logger,
    );
  }

  async onApplicationBootstrap() {
    const settings = await this.getSettings();

    this.client = new Ollama({ host: settings.api_url });
  }

  @OnEvent('hook:ollama:api_url')
  handleApiUrlChange(setting: Setting) {
    this.client = new Ollama({ host: setting.value });
  }

  /**
   * Generates a response using LLM
   *
   * @param prompt - The input text from the user
   * @param model - The model to be used
   * @returns {Promise<string>} - The generated response from the LLM
   */
  async generateResponse(prompt: string, model: string): Promise<string> {
    const response = await this.client.generate({
      model,
      prompt,
    });

    return response.response ? response.response : '';
  }

  /**
   * Formats messages to the Ollama required data structure
   *
   * @param messages - Message history to include
   *
   * @returns Ollama message array
   */
  private formatMessages(messages: AnyMessage[]) {
    return messages.map((m) => {
      return {
        role: 'sender' in m && m.sender ? 'user' : 'assistant',
        content: 'text' in m.message && m.message.text ? m.message.text : '',
      };
    });
  }

  /**
   * Send a chat completion request with the conversation history.
   * You can use this same approach to start the conversation
   * using multi-shot or chain-of-thought prompting.
   *
   * @param prompt - The input text from the user
   * @param model - The model to be used
   * @param history - Array of messages
   * @returns {Promise<string>} - The generated response from the LLM
   */
  public async generateChatCompletion(
    prompt: string,
    model: string,
    systemPrompt: string,
    history: AnyMessage[] = [],
    { keepAlive = '5m', options = {} },
  ) {
    const response = await this.client.chat({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...this.formatMessages(history),
        {
          role: 'user',
          content: prompt,
        },
      ],
      keep_alive: keepAlive,
      options,
    });

    return response.message.content ? response.message.content : '';
  }
}
