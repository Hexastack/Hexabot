/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Subscriber, SubscriberFull } from '@hexabot-ai/types';
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { FindManyOptions } from 'typeorm';

import { AttachmentService } from '@/attachment/services/attachment.service';
import { TFilterNestedKeysOfType, UuidParam } from '@/utils';
import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { generateInitialsAvatar } from '@/utils/helpers/avatar';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';

import { SubscriberUpdateDto } from '../dto/subscriber.dto';
import { SubscriberOrmEntity } from '../entities/subscriber.entity';
import { SubscriberService } from '../services/subscriber.service';

export const SUBSCRIBER_ALLOWED_FILTER_FIELDS: TFilterNestedKeysOfType<SubscriberOrmEntity>[] =
  [
    'firstName',
    'lastName',
    'assignedTo.id',
    'channel.name',
    'source.id',
    // TODO : type need to be enhanced to include 'labels'
    'labels' as any,
  ];

@Controller('subscriber')
export class SubscriberController extends BaseOrmController<SubscriberOrmEntity> {
  constructor(
    private readonly subscriberService: SubscriberService,
    private readonly attachmentService: AttachmentService,
  ) {
    super(subscriberService);
  }

  /**
   * Retrieves a paginated list of subscribers based on provided query parameters.
   * Supports filtering, pagination, and population of related fields.
   *
   * @param populate - List of fields to populate in the response.
   * @param options - Combined filters, pagination, and sorting for the query.
   * @returns A promise containing the paginated and optionally populated list of subscribers.
   */
  @Get()
  async findSubscribers(
    @Query(PopulatePipe)
    populate: string[],
    @Query(
      new TypeOrmSearchFilterPipe<SubscriberOrmEntity>({
        // TODO : Check if the field email should be added to Subscriber schema
        allowedFields: SUBSCRIBER_ALLOWED_FILTER_FIELDS,
        defaultSort: ['createdAt', 'desc'],
      }),
    )
    options: FindManyOptions<SubscriberOrmEntity>,
  ): Promise<Subscriber[] | SubscriberFull[]> {
    return await this.find(options, populate);
  }

  /**
   * Retrieves the count of subscribers that match the provided search filters.
   *
   * @param options - Combined filters, pagination, and sorting for the query.
   * @returns A promise containing the count of subscribers matching the filters.
   */
  @Get('count')
  async filterCount(
    @Query(
      new TypeOrmSearchFilterPipe<SubscriberOrmEntity>({
        allowedFields: SUBSCRIBER_ALLOWED_FILTER_FIELDS,
      }),
    )
    options: FindManyOptions<SubscriberOrmEntity> = {},
  ): Promise<{ count: number }> {
    return await this.count(options);
  }

  /**
   * Retrieves a single subscriber by their unique ID.
   * Supports optional population of related fields.
   *
   * @param id - The unique identifier of the subscriber to retrieve.
   * @param populate - An optional list of related fields to populate in the response.
   * @returns The subscriber object, populated if requested.
   */
  @Get(':id')
  async findSubscriber(
    @UuidParam('id') id: string,
    @Query(PopulatePipe)
    populate: string[],
  ): Promise<Subscriber | SubscriberFull> {
    return await this.findOne(id, populate);
  }

  /**
   * Retrieves the profile picture (avatar) of a subscriber by their unique ID.
   * If no avatar is set, generates an initials-based avatar.
   *
   * @param id - The unique identifier of the subscriber whose profile picture is to be retrieved.
   * @returns A streamable file containing the avatar image.
   */
  @Get(':id/profile_pic')
  async getAvatar(
    @UuidParam('id') id: string,
  ): Promise<StreamableFile | undefined> {
    const subscriber = await this.subscriberService.findOneAndPopulate(id);

    if (!subscriber) {
      throw new NotFoundException(`Subscriber with ID ${id} not found`);
    }

    try {
      if (!subscriber.avatar) {
        throw new Error('User has no avatar');
      }

      return await this.attachmentService.download(subscriber.avatar);
    } catch (err) {
      this.logger.verbose(
        'Subscriber has no avatar, generating initials avatar ...',
        err,
      );

      return await generateInitialsAvatar(subscriber);
    }
  }

  @Patch(':id')
  async updateOne(
    @UuidParam('id') id: string,
    @Body() subscriberUpdate: SubscriberUpdateDto,
  ) {
    const profile = await this.subscriberService.findOne(id);

    if ('assignedTo' in subscriberUpdate && profile) {
      if (subscriberUpdate.assignedTo) {
        return await this.subscriberService.handOver(
          profile,
          subscriberUpdate.assignedTo,
        );
      } else {
        return await this.subscriberService.handBack(profile);
      }
    }

    return await this.subscriberService.updateOne(id, subscriberUpdate);
  }
}
