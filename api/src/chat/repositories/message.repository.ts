/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TFilterQuery, Model, Query } from 'mongoose';

import { LoggerService } from '@/logger/logger.service';
import { NlpSampleCreateDto } from '@/nlp/dto/nlp-sample.dto';
import { NlpSampleState } from '@/nlp/schemas/types';
import { NlpSampleService } from '@/nlp/services/nlp-sample.service';
import { BaseRepository } from '@/utils/generics/base-repository';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';

import { Message, MessageFull } from '../schemas/message.schema';
import { Subscriber } from '../schemas/subscriber.schema';
import { AnyMessage } from '../schemas/types/message';

@Injectable()
export class MessageRepository extends BaseRepository<
  AnyMessage,
  'sender' | 'recipient'
> {
  private readonly nlpSampleService: NlpSampleService;

  private readonly logger: LoggerService;

  constructor(
    @InjectModel(Message.name) readonly model: Model<AnyMessage>,
    @Optional() nlpSampleService?: NlpSampleService,
    @Optional() logger?: LoggerService,
  ) {
    super(model, Message as new () => AnyMessage);
    this.logger = logger;
    this.nlpSampleService = nlpSampleService;
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
        const record: NlpSampleCreateDto = {
          text: _doc.message.text,
          type: NlpSampleState.inbox,
          trained: false,
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
   * Retrieves a paginated list of messages with sender and recipient populated.
   * Uses filter criteria and pagination settings for the query.
   *
   * @param filters - Filter criteria for querying messages.
   * @param pageQuery - Pagination settings, including skip, limit, and sort order.
   *
   * @returns A paginated list of messages with sender and recipient details populated.
   */
  async findPageAndPopulate(
    filters: TFilterQuery<AnyMessage>,
    pageQuery: PageQueryDto<AnyMessage>,
  ) {
    const query = this.findPageQuery(filters, pageQuery).populate([
      'sender',
      'recipient',
    ]);

    return await this.execute(
      query as Query<AnyMessage[], AnyMessage, object, AnyMessage, 'find'>,
      MessageFull,
    );
  }

  /**
   * Retrieves a single message by its ID, populating the sender and recipient fields.
   *
   * @param id - The ID of the message to retrieve.
   *
   * @returns The message with sender and recipient details populated.
   */
  async findOneAndPopulate(id: string) {
    const query = this.findOneQuery(id).populate(['sender', 'recipient']);
    return await this.executeOne(query, MessageFull);
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
