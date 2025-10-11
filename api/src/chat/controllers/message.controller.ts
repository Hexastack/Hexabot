/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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

import { ChannelService } from '@/channel/channel.service';
import { GenericEventWrapper } from '@/channel/lib/EventWrapper';
import { BaseController } from '@/utils/generics/base-controller';
import { BaseSchema } from '@/utils/generics/base-schema';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { PageQueryPipe } from '@/utils/pagination/pagination-query.pipe';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';
import { TFilterQuery } from '@/utils/types/filter.types';

import { MessageCreateDto } from '../dto/message.dto';
import {
  Message,
  MessageFull,
  MessagePopulate,
  MessageStub,
} from '../schemas/message.schema';
import { Subscriber } from '../schemas/subscriber.schema';
import {
  AnyMessage,
  OutgoingMessage,
  OutgoingMessageFormat,
  StdOutgoingEnvelope,
  StdOutgoingMessage,
  StdOutgoingTextMessage,
} from '../schemas/types/message';
import { MessageService } from '../services/message.service';
import { SubscriberService } from '../services/subscriber.service';

@Controller('message')
export class MessageController extends BaseController<
  AnyMessage,
  MessageStub,
  MessagePopulate,
  MessageFull
> {
  constructor(
    private readonly messageService: MessageService,
    private readonly subscriberService: SubscriberService,
    private readonly channelService: ChannelService,
  ) {
    super(messageService);
  }

  @Get()
  async findPage(
    @Query(PageQueryPipe) pageQuery: PageQueryDto<AnyMessage>,
    @Query(PopulatePipe)
    populate: string[],
    @Query(
      new SearchFilterPipe<Message>({ allowedFields: ['recipient', 'sender'] }),
    )
    filters: TFilterQuery<Message>,
  ) {
    return this.canPopulate(populate)
      ? await this.messageService.findAndPopulate(filters, pageQuery)
      : await this.messageService.find(filters, pageQuery);
  }

  /**
   * Counts the filtered number of messages.
   * @returns A promise that resolves to an object representing the filtered number of messages.
   */
  @Get('count')
  async filterCount(
    @Query(
      new SearchFilterPipe<Message>({
        allowedFields: ['recipient', 'sender'],
      }),
    )
    filters?: TFilterQuery<Message>,
  ) {
    return await this.count(filters);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query(PopulatePipe)
    populate: string[],
  ) {
    const doc = this.canPopulate(populate)
      ? await this.messageService.findOneAndPopulate(id)
      : await this.messageService.findOne(id);
    if (!doc) {
      this.logger.warn(`Unable to find Message by id ${id}`);
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
    return doc;
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

    const channelData = Subscriber.getChannelData(subscriber);

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
      senderId: subscriber.foreign_id,
      messageId: messageDto.inReplyTo,
    });

    event.setSender(subscriber);
    try {
      const { mid } = await channelHandler.sendMessage(event, envelope, {}, {});
      // Trigger sent message event
      const sentMessage: Omit<OutgoingMessage, keyof BaseSchema> = {
        mid,
        recipient: subscriber.id,
        message: messageDto.message as StdOutgoingMessage,
        sentBy: req.session.passport?.user?.id,
        read: false,
        delivery: false,
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
