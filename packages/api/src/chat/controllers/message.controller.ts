/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { FindManyOptions } from 'typeorm';

import { ChannelService } from '@/channel/channel.service';
import { GenericEventWrapper } from '@/channel/lib/EventWrapper';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';

import {
  Message,
  MessageCreateDto,
  MessageDtoConfig,
  MessageFull,
  MessageTransformerDto,
} from '../dto/message.dto';
import { MessageOrmEntity } from '../entities/message.entity';
import { MessageService } from '../services/message.service';
import { SubscriberService } from '../services/subscriber.service';
import {
  OutgoingMessage,
  OutgoingMessageFormat,
  StdOutgoingEnvelope,
  StdOutgoingMessage,
  StdOutgoingTextMessage,
} from '../types/message';

@Controller('message')
export class MessageController extends BaseOrmController<
  MessageOrmEntity,
  MessageTransformerDto,
  MessageDtoConfig
> {
  constructor(
    private readonly messageService: MessageService,
    private readonly subscriberService: SubscriberService,
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
          'sender.id',
          'recipient.id',
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
          'sender.id',
          'recipient.id',
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
    @Param('id') id: string,
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
    //TODO : Investigate if recipient and inReplyTo should be updated to required in dto
    if (!messageDto.recipient || !messageDto.inReplyTo) {
      throw new BadRequestException('MessageController send : invalid params');
    }

    const subscriber = await this.subscriberService.findOne(
      messageDto.recipient,
    );
    if (!subscriber) {
      this.logger.warn(
        `Unable to find subscriber by id ${messageDto.recipient}`,
      );
      throw new NotFoundException(
        `Subscriber with ID ${messageDto.recipient} not found`,
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
    const channelHandler = this.channelService.getChannelHandler(
      channelData.name,
    );
    const event = new GenericEventWrapper(channelHandler, {
      senderId: subscriber.foreignId,
      messageId: messageDto.inReplyTo,
    });

    event.setSender(subscriber);
    try {
      const { mid } = await channelHandler.sendMessage(event, envelope, {}, {});
      // Trigger sent message event
      const sentMessage: Omit<OutgoingMessage, keyof BaseOrmEntity> = {
        mid,
        recipient: subscriber.id,
        message: messageDto.message as StdOutgoingMessage,
        sentBy: req.session.passport?.user?.id,
        read: false,
        delivery: false,
        handover: false,
      };
      this.eventEmitter.emit('hook:chatbot:sent', sentMessage);

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
