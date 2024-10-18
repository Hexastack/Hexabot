/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { LoggerService } from '@nestjs/common';

import { AnyMessage } from '@/chat/schemas/types/message';
import { SettingService } from '@/setting/services/setting.service';

import BaseHelper from './BaseHelper';
import { HelperService } from '../helper.service';

export default abstract class BaseLlmHelper extends BaseHelper {
  constructor(
    protected readonly settingService: SettingService,
    protected readonly helperService: HelperService,
    protected readonly logger: LoggerService,
  ) {
    super(settingService, helperService, logger);
  }

  /**
   * Generates a response using LLM
   *
   * @param prompt - The input text from the user
   * @param model - The model to be used
   * @returns {Promise<string>} - The generated response from the LLM
   */
  abstract generateResponse(prompt: string, model: string): Promise<string>;

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
  abstract generateChatCompletion(
    prompt: string,
    model: string,
    systemPrompt?: string,
    history?: AnyMessage[],
    extra?: any,
  ): Promise<string>;
}
