/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  StreamableFile,
} from '@nestjs/common';

import { AttachmentService } from '@/attachment/services/attachment.service';
import { BaseController } from '@/utils/generics/base-controller';
import { generateInitialsAvatar } from '@/utils/helpers/avatar';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { PageQueryPipe } from '@/utils/pagination/pagination-query.pipe';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';
import { TFilterQuery } from '@/utils/types/filter.types';

import { SubscriberUpdateDto } from '../dto/subscriber.dto';
import {
  Subscriber,
  SubscriberFull,
  SubscriberPopulate,
  SubscriberStub,
} from '../schemas/subscriber.schema';
import { SubscriberService } from '../services/subscriber.service';

@Controller('subscriber')
export class SubscriberController extends BaseController<
  Subscriber,
  SubscriberStub,
  SubscriberPopulate,
  SubscriberFull
> {
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
   * @param pageQuery - The pagination and sorting options.
   * @param populate - List of fields to populate in the response.
   * @param filters - Search filters to apply on the Subscriber model.
   * @returns A promise containing the paginated and optionally populated list of subscribers.
   */
  @Get()
  async findPage(
    @Query(PageQueryPipe) pageQuery: PageQueryDto<Subscriber>,
    @Query(PopulatePipe)
    populate: string[],
    @Query(
      new SearchFilterPipe<Subscriber>({
        // TODO : Check if the field email should be added to Subscriber schema
        allowedFields: [
          'first_name',
          'last_name',
          'assignedTo',
          'labels',
          'channel.name',
        ],
      }),
    )
    filters: TFilterQuery<Subscriber>,
  ) {
    return this.canPopulate(populate)
      ? await this.subscriberService.findAndPopulate(filters, pageQuery)
      : await this.subscriberService.find(filters, pageQuery);
  }

  /**
   * Retrieves the count of subscribers that match the provided search filters.
   *
   * @param filters - Optional search filters to apply on the Subscriber model.
   * @returns A promise containing the count of subscribers matching the filters.
   */
  @Get('count')
  async filterCount(
    @Query(
      new SearchFilterPipe<Subscriber>({
        allowedFields: [
          'first_name',
          'last_name',
          'assignedTo',
          'labels',
          'channel.name',
        ],
      }),
    )
    filters?: TFilterQuery<Subscriber>,
  ) {
    return await this.count(filters);
  }

  /**
   * Retrieves a single subscriber by their unique ID.
   * Supports optional population of related fields.
   *
   * @param id - The unique identifier of the subscriber to retrieve.
   * @param populate - An optional list of related fields to populate in the response.
   * @returns The subscriber document, populated if requested.
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query(PopulatePipe)
    populate: string[],
  ) {
    const doc = this.canPopulate(populate)
      ? await this.subscriberService.findOneAndPopulate(id)
      : await this.subscriberService.findOne(id);
    if (!doc) {
      this.logger.warn(`Unable to find Subscriber by id ${id}`);
      throw new NotFoundException(`Subscriber with ID ${id} not found`);
    }
    return doc;
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
    @Param('id') id: string,
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
    @Param('id') id: string,
    @Body() subscriberUpdate: SubscriberUpdateDto,
  ) {
    return await this.subscriberService.updateOne(id, subscriberUpdate);
  }
}
