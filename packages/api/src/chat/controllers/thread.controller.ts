/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { FindManyOptions } from 'typeorm';

import { UuidParam } from '@/utils';
import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';
import { TFilterNestedKeysOfType } from '@/utils/types/filter.types';

import {
  Thread,
  ThreadCreateDto,
  ThreadFull,
  ThreadUpdateDto,
} from '../dto/thread.dto';
import { ThreadOrmEntity } from '../entities/thread.entity';
import { ThreadService } from '../services/thread.service';

export const THREAD_ALLOWED_FILTER_FIELDS: TFilterNestedKeysOfType<ThreadOrmEntity>[] =
  [
    'subscriber.id',
    'subscriber.firstName',
    'subscriber.lastName',
    'subscriber.channel.name',
    'subscriber.assignedTo.id',
    'status',
    'closeReason',
    'title',
  ];

@Controller('thread')
export class ThreadController extends BaseOrmController<ThreadOrmEntity> {
  constructor(private readonly threadService: ThreadService) {
    super(threadService);
  }

  @Get()
  async findPage(
    @Query(PopulatePipe)
    populate: string[],
    @Query(
      new TypeOrmSearchFilterPipe<ThreadOrmEntity>({
        allowedFields: THREAD_ALLOWED_FILTER_FIELDS,
        defaultSort: ['lastMessageAt', 'desc'],
      }),
    )
    options: FindManyOptions<ThreadOrmEntity>,
  ): Promise<Thread[] | ThreadFull[]> {
    const queryOptions = options ?? {};

    return this.canPopulate(populate)
      ? await this.threadService.findAndPopulate(queryOptions)
      : await this.threadService.find(queryOptions);
  }

  @Get('count')
  async filterCount(
    @Query(
      new TypeOrmSearchFilterPipe<ThreadOrmEntity>({
        allowedFields: THREAD_ALLOWED_FILTER_FIELDS,
      }),
    )
    options?: FindManyOptions<ThreadOrmEntity>,
  ): Promise<{ count: number }> {
    return await this.count(options ?? {});
  }

  @Get(':id')
  async findOne(
    @UuidParam('id') id: string,
    @Query(PopulatePipe)
    populate: string[],
  ): Promise<Thread | ThreadFull> {
    const record = this.canPopulate(populate)
      ? await this.threadService.findOneAndPopulate(id)
      : await this.threadService.findOne(id);
    if (!record) {
      this.logger.warn(`Unable to find Thread by id ${id}`);
      throw new NotFoundException(`Thread with ID ${id} not found`);
    }

    return record;
  }

  @Post()
  async create(@Body() threadCreate: ThreadCreateDto): Promise<Thread> {
    return await this.threadService.create(threadCreate);
  }

  @Patch(':id')
  async updateOne(
    @UuidParam('id') id: string,
    @Body() threadUpdate: ThreadUpdateDto,
  ) {
    return await this.threadService.updateOne(id, threadUpdate);
  }
}
