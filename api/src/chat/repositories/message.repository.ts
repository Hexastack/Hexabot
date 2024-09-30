/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { LanguageService } from '@/i18n/services/language.service';
import { LoggerService } from '@/logger/logger.service';
import { NlpSampleCreateDto } from '@/nlp/dto/nlp-sample.dto';
import { NlpSampleState } from '@/nlp/schemas/types';
import { NlpSampleService } from '@/nlp/services/nlp-sample.service';
import { BaseRepository } from '@/utils/generics/base-repository';

import {
  Message,
  MESSAGE_POPULATE,
  MessageFull,
  MessagePopulate,
} from '../schemas/message.schema';
import { Subscriber } from '../schemas/subscriber.schema';
import { AnyMessage } from '../schemas/types/message';

@Injectable()
export class MessageRepository extends BaseRepository<
  AnyMessage,
  MessagePopulate,
  MessageFull
> {
  private readonly nlpSampleService: NlpSampleService;

  private readonly logger: LoggerService;

  private readonly languageService: LanguageService;

  constructor(
    @InjectModel(Message.name) readonly model: Model<AnyMessage>,
    @Optional() nlpSampleService?: NlpSampleService,
    @Optional() logger?: LoggerService,
    @Optional() languageService?: LanguageService,
  ) {
    super(
      model,
      Message as new () => AnyMessage,
      MESSAGE_POPULATE,
      MessageFull,
    );
    this.logger = logger;
    this.nlpSampleService = nlpSampleService;
    this.languageService = languageService;
  }

  /**
   * Pre-create hook to validate message data before saving.
   * If the message is from a end-user (i.e., has a sender), it is saved
   * as an inbox NLP sample. Throws an error if neither sender nor recipient
   * is provided.
   *
   * @param _doc - The message document to be created.
   */
  async preCreate(_doc: AnyMessage): Promise<void> {
    if (_doc) {
      if (!('sender' in _doc) && !('recipient' in _doc)) {
        this.logger.error('Either sender or recipient must be provided!', _doc);
        throw new Error('Either sender or recipient must be provided!');
      }
      // If message is sent by the user then add it as an inbox sample
      if (
        'sender' in _doc &&
        _doc.sender &&
        'message' in _doc &&
        'text' in _doc.message
      ) {
        const defaultLang = await this.languageService?.getDefaultLanguage();
        const record: NlpSampleCreateDto = {
          text: _doc.message.text,
          type: NlpSampleState.inbox,
          trained: false,
          // @TODO : We need to define the language in the message entity
          language: defaultLang.id,
        };
        try {
          await this.nlpSampleService.findOneOrCreate(record, record);
          this.logger.debug('User message saved as a inbox sample !');
        } catch (err) {
          this.logger.error(
            'Unable to add message as a new inbox sample!',
            err,
          );
          throw err;
        }
      }
    }
  }

  /**
   * Retrieves the message history for a given subscriber, with messages sent or received
   * before the specified date. Results are limited and sorted by creation date.
   *
   * @param subscriber - The subscriber whose message history is being retrieved.
   * @param until - Optional date to retrieve messages sent before (default: current date).
   * @param limit - Optional limit on the number of messages to retrieve (default: 30).
   *
   * @returns The message history until the specified date.
   */
  async findHistoryUntilDate(
    subscriber: Subscriber,
    until = new Date(),
    limit: number = 30,
  ) {
    return await this.findPage(
      {
        $or: [{ recipient: subscriber.id }, { sender: subscriber.id }],
        createdAt: { $lt: until },
      },
      { skip: 0, limit, sort: ['createdAt', 'desc'] },
    );
  }

  /**
   * Retrieves the message history for a given subscriber, with messages sent or received
   * after the specified date. Results are limited and sorted by creation date.
   *
   * @param subscriber The subscriber whose message history is being retrieved.
   * @param since Optional date to retrieve messages sent after (default: current date).
   * @param limit Optional limit on the number of messages to retrieve (default: 30).
   *
   * @returns The message history since the specified date.
   */
  async findHistorySinceDate(
    subscriber: Subscriber,
    since = new Date(),
    limit: number = 30,
  ) {
    return await this.findPage(
      {
        $or: [{ recipient: subscriber.id }, { sender: subscriber.id }],
        createdAt: { $gt: since },
      },
      { skip: 0, limit, sort: ['createdAt', 'asc'] },
    );
  }
}
