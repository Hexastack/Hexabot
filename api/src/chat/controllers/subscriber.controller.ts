/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
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
  UseInterceptors,
} from '@nestjs/common';
import { CsrfCheck } from '@tekuconcept/nestjs-csrf';
import { TFilterQuery } from 'mongoose';

import { CsrfInterceptor } from '@/interceptors/csrf.interceptor';
import { LoggerService } from '@/logger/logger.service';
import { Roles } from '@/utils/decorators/roles.decorator';
import { BaseController } from '@/utils/generics/base-controller';
import { generateInitialsAvatar } from '@/utils/helpers/avatar';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { PageQueryPipe } from '@/utils/pagination/pagination-query.pipe';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';

import { SubscriberUpdateDto } from '../dto/subscriber.dto';
import {
  Subscriber,
  SubscriberFull,
  SubscriberPopulate,
  SubscriberStub,
} from '../schemas/subscriber.schema';
import { SubscriberService } from '../services/subscriber.service';

@UseInterceptors(CsrfInterceptor)
@Controller('subscriber')
export class SubscriberController extends BaseController<
  Subscriber,
  SubscriberStub,
  SubscriberPopulate,
  SubscriberFull
> {
  constructor(
    private readonly subscriberService: SubscriberService,
    private readonly logger: LoggerService,
  ) {
    super(subscriberService);
  }

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
      ? await this.subscriberService.findPageAndPopulate(filters, pageQuery)
      : await this.subscriberService.findPage(filters, pageQuery);
  }

  /**
   * Counts the filtered number of subscribers.
   * @returns A promise that resolves to an object representing the filtered number of subscribers.
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

  @Roles('public')
  @Get(':foreign_id/profile_pic')
  async findProfilePic(
    @Param('foreign_id') foreign_id: string,
  ): Promise<StreamableFile> {
    try {
      const pic = await this.subscriberService.findProfilePic(foreign_id);
      return pic;
    } catch (e) {
      const [subscriber] = await this.subscriberService.find({ foreign_id });
      if (subscriber) {
        return generateInitialsAvatar(subscriber);
      } else {
        throw new NotFoundException(
          `Subscriber with ID ${foreign_id} not found`,
        );
      }
    }
  }

  @CsrfCheck(true)
  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() subscriberUpdate: SubscriberUpdateDto,
  ) {
    const result = await this.subscriberService.updateOne(id, subscriberUpdate);
    if (!result) {
      this.logger.warn(`Unable to update Subscriber by id ${id}`);
      throw new NotFoundException(`Subscriber with ID ${id} not found`);
    }
    return result;
  }
}
