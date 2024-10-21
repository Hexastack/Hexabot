/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { AnyMessage } from '@/chat/schemas/types/message';
import { Language } from '@/i18n/schemas/language.schema';
import { LanguageService } from '@/i18n/services/language.service';
import { LoggerService } from '@/logger/logger.service';
import { BaseService } from '@/utils/generics/base-service';

import { NlpSampleCreateDto } from '../dto/nlp-sample.dto';
import { NlpSampleRepository } from '../repositories/nlp-sample.repository';
import {
  NlpSample,
  NlpSampleFull,
  NlpSamplePopulate,
} from '../schemas/nlp-sample.schema';
import { NlpSampleState } from '../schemas/types';

@Injectable()
export class NlpSampleService extends BaseService<
  NlpSample,
  NlpSamplePopulate,
  NlpSampleFull
> {
  constructor(
    readonly repository: NlpSampleRepository,
    private readonly languageService: LanguageService,
    private readonly logger: LoggerService,
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

  @OnEvent('hook:message:preCreate')
  async handleNewMessage(doc: AnyMessage) {
    // If message is sent by the user then add it as an inbox sample
    if (
      'sender' in doc &&
      doc.sender &&
      'message' in doc &&
      'text' in doc.message
    ) {
      const defaultLang = await this.languageService.getDefaultLanguage();
      const record: NlpSampleCreateDto = {
        text: doc.message.text,
        type: NlpSampleState.inbox,
        trained: false,
        // @TODO : We need to define the language in the message entity
        language: defaultLang.id,
      };
      try {
        await this.findOneOrCreate(record, record);
        this.logger.debug('User message saved as a inbox sample !');
      } catch (err) {
        this.logger.error('Unable to add message as a new inbox sample!', err);
        throw err;
      }
    }
  }
}
