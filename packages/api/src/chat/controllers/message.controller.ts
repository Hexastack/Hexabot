/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { FindManyOptions } from 'typeorm';

import { ChannelService } from '@/channel/channel.service';
import { GenericEventWrapper } from '@/channel/lib/ConversationalEventWrapper';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { UuidParam } from '@/utils';
import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';

import { Message, MessageCreateDto, MessageFull } from '../dto/message.dto';
import { Thread } from '../dto/thread.dto';
import { MessageOrmEntity } from '../entities/message.entity';
import { MessageService } from '../services/message.service';
import { SubscriberService } from '../services/subscriber.service';
import { ThreadService } from '../services/thread.service';
import {
  OutgoingMessage,
  OutgoingMessageFormat,
  StdOutgoingEnvelope,
  StdOutgoingMessage,
  StdOutgoingTextMessage,
} from '../types/message';

@Controller('message')
export class MessageController extends BaseOrmController<MessageOrmEntity> {
  constructor(
    private readonly messageService: MessageService,
    private readonly subscriberService: SubscriberService,
    private readonly threadService: ThreadService,
    private readonly channelService: ChannelService,
  ) {
    super(messageService);
  }

  /** Retrieves messages using TypeORM filters and optional relation population. */
  @Get()
  async findPage(
    @Query(PopulatePipe)
    populate: string[],
    @Query(
      new TypeOrmSearchFilterPipe<MessageOrmEntity>({
        allowedFields: [
          'thread.id',
          'sentBy.id',
          'mid',
          'read',
          'delivery',
          'handover',
        ],
        defaultSort: ['createdAt', 'desc'],
      }),
    )
    options: FindManyOptions<MessageOrmEntity>,
  ): Promise<Message[] | MessageFull[]> {
    const queryOptions = options ?? {};

    return this.canPopulate(populate)
      ? await this.messageService.findAndPopulate(queryOptions)
      : await this.messageService.find(queryOptions);
  }

  /**
   * Counts the filtered number of messages.
   * @returns A promise that resolves to an object representing the filtered number of messages.
   */
  @Get('count')
  async filterCount(
    @Query(
      new TypeOrmSearchFilterPipe<MessageOrmEntity>({
        allowedFields: [
          'thread.id',
          'sentBy.id',
          'mid',
          'read',
          'delivery',
          'handover',
        ],
      }),
    )
    options?: FindManyOptions<MessageOrmEntity>,
  ): Promise<{ count: number }> {
    return await this.count(options ?? {});
  }

  @Get(':id')
  async findOne(
    @UuidParam('id') id: string,
    @Query(PopulatePipe)
    populate: string[],
  ): Promise<Message | MessageFull> {
    const record = this.canPopulate(populate)
      ? await this.messageService.findOneAndPopulate(id)
      : await this.messageService.findOne(id);
    if (!record) {
      this.logger.warn(`Unable to find Message by id ${id}`);
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return record;
  }

  @Post()
  async create(@Body() messageDto: MessageCreateDto, @Req() req: Request) {
    if (!messageDto.thread) {
      throw new BadRequestException(
        'MessageController send : thread id is required',
      );
    }

    const thread = await this.threadService.findOneAndPopulate(
      messageDto.thread,
    );
    if (!thread?.subscriber) {
      this.logger.warn(`Unable to find thread by id ${messageDto.thread}`);
      throw new NotFoundException(
        `Thread with ID ${messageDto.thread} not found`,
      );
    }

    const subscriber = await this.subscriberService.findOne(
      thread.subscriber.id,
    );
    if (!subscriber) {
      this.logger.warn(
        `Unable to find subscriber by id ${thread.subscriber.id}`,
      );
      throw new NotFoundException(
        `Subscriber with ID ${thread.subscriber.id} not found`,
      );
    }

    const channelData = subscriber.channel;

    if (!this.channelService.findChannel(channelData.name)) {
      throw new BadRequestException(`Subscriber channel not found`);
    }

    const envelope: StdOutgoingEnvelope = {
      format: OutgoingMessageFormat.text,
      message: messageDto.message as StdOutgoingTextMessage,
    };
    const latestMessageId = messageDto.inReplyTo
      ? messageDto.inReplyTo
      : (
          await this.messageService.findLastMessages(
            { id: thread.id } as Thread,
            1,
          )
        ).at(0)?.mid;
    const channelHandler = this.channelService.getChannelHandler(
      channelData.name,
    );
    const event = new GenericEventWrapper(channelHandler, {
      senderId: subscriber.foreignId,
      messageId: latestMessageId ?? randomUUID(),
    });

    event.setInitiator(subscriber);
    event.setThreadId(thread.id);
    try {
      const { mid } = await channelHandler.sendMessage(event, envelope, {});
      // Trigger sent message event
      const sentMessage: Omit<OutgoingMessage, keyof BaseOrmEntity> = {
        mid,
        recipient: subscriber.id,
        thread: thread.id,
        message: messageDto.message as StdOutgoingMessage,
        sentBy: req.session.passport?.user?.id,
        read: false,
        delivery: false,
        handover: false,
      };
      this.eventEmitter.emit('hook:chatbot:sent', sentMessage, event);

      return {
        success: true,
      };
    } catch (err) {
      this.logger.debug('Unable to send message', err);
      throw new BadRequestException(
        'MessageController send : unable to send message',
      );
    }
  }
}
