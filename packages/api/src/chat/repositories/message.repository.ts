/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';
import { DtoTransformer } from '@/utils/types/dto.types';

import {
  Message,
  MessageDtoConfig,
  MessageFull,
  MessageTransformerDto,
} from '../dto/message.dto';
import { SubscriberStub } from '../dto/subscriber.dto';
import { MessageOrmEntity } from '../entities/message.entity';

@Injectable()
export class MessageRepository extends BaseOrmRepository<
  MessageOrmEntity,
  MessageTransformerDto,
  MessageDtoConfig
> {
  constructor(
    @InjectRepository(MessageOrmEntity)
    repository: Repository<MessageOrmEntity>,
  ) {
    super(repository, ['sender', 'recipient', 'sentBy'], {
      PlainCls: Message,
      FullCls: MessageFull,
    });
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
  async findHistoryUntilDate<S extends SubscriberStub>(
    subscriber: S,
    until = new Date(),
    limit: number = 30,
  ): Promise<Message[]> {
    const qb = this.repository
      .createQueryBuilder('message')
      .where(
        new Brackets((where) => {
          where
            .where('message.sender_id = :subscriberId', {
              subscriberId: subscriber.id,
            })
            .orWhere('message.recipient_id = :subscriberId', {
              subscriberId: subscriber.id,
            });
        }),
      )
      .andWhere('message.created_at < :until', { until })
      .orderBy('message.created_at', 'DESC')
      .limit(limit);
    const results = await qb.getMany();
    const toDto = this.getTransformer(DtoTransformer.PlainCls);

    return results.map(toDto);
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
  async findHistorySinceDate<S extends SubscriberStub>(
    subscriber: S,
    since = new Date(),
    limit: number = 30,
  ): Promise<Message[]> {
    const qb = this.repository
      .createQueryBuilder('message')
      .where(
        new Brackets((where) => {
          where
            .where('message.sender_id = :subscriberId', {
              subscriberId: subscriber.id,
            })
            .orWhere('message.recipient_id = :subscriberId', {
              subscriberId: subscriber.id,
            });
        }),
      )
      .andWhere('message.created_at > :since', { since })
      .orderBy('message.created_at', 'ASC')
      .limit(limit);
    const results = await qb.getMany();
    const toDto = this.getTransformer(DtoTransformer.PlainCls);

    return results.map(toDto);
  }

  /**
   * Retrieves the most recent messages exchanged with the provided subscriber and returns them in chronological order.
   *
   * @param subscriber - The subscriber whose messages are being retrieved.
   * @param limit - Maximum number of messages to return.
   *
   * @returns The latest messages ordered from oldest to newest.
   */
  async findLastMessagesForSubscriber<S extends SubscriberStub>(
    subscriber: S,
    limit: number = 5,
  ): Promise<Message[]> {
    const normalizedLimit = Math.max(0, limit ?? 0);

    if (!normalizedLimit) {
      return [];
    }

    const results = await this.repository
      .createQueryBuilder('message')
      .where(
        new Brackets((where) => {
          where
            .where('message.sender_id = :subscriberId', {
              subscriberId: subscriber.id,
            })
            .orWhere('message.recipient_id = :subscriberId', {
              subscriberId: subscriber.id,
            });
        }),
      )
      .orderBy('message.created_at', 'DESC')
      .limit(limit)
      .getMany();
    const toDto = this.getTransformer(DtoTransformer.PlainCls);

    return results.map(toDto);
  }

  /**
   * Checks if a subscriber has the required permission to access the message including the attachment.
   * @param subscriberId - The ID of the subscriber.
   * @param attachmentId - The ID of the attachment
   * @returns A promise that resolves to a boolean
   */
  async hasMessageAccess(subscriberId: string, attachmentId: string) {
    const manager = this.repository.manager;
    const databaseType = manager.connection.options.type;
    const qb = this.repository
      .createQueryBuilder('message')
      .where('message.recipient_id = :subscriberId', { subscriberId });

    if (['sqlite', 'better-sqlite3'].includes(databaseType)) {
      qb.andWhere(
        `(
          (
            json_type(json_extract(message.message, '$.attachment')) = 'object'
            AND json_extract(message.message, '$.attachment.payload.id') = :attId
          )
          OR (
            json_type(json_extract(message.message, '$.attachment')) = 'array'
            AND EXISTS (
              SELECT 1
              FROM json_each(json_extract(message.message, '$.attachment')) AS a
              WHERE json_extract(a.value, '$.payload.id') = :attId
            )
          )
        )`,
        { attId: attachmentId },
      );
    } else if (databaseType === 'postgres') {
      const jsonColumn = '(message.message::jsonb)';

      qb.andWhere(
        `(
          (
            jsonb_typeof(${jsonColumn} -> 'attachment') = 'object'
            AND (${jsonColumn} -> 'attachment' -> 'payload' ->> 'id') = :attId
          )
          OR (
            jsonb_typeof(${jsonColumn} -> 'attachment') = 'array'
            AND EXISTS (
              SELECT 1
              FROM jsonb_array_elements(${jsonColumn} -> 'attachment') AS a
              WHERE a -> 'payload' ->> 'id' = :attId
            )
          )
        )`,
        { attId: attachmentId },
      );
    } else {
      throw new Error(`Unsupported database type: ${databaseType}`);
    }

    const messageCount = await qb.getCount();

    return messageCount > 0;
  }
}
