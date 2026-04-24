/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Source, SourceFull } from '@hexabot-ai/types';
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { FindManyOptions } from 'typeorm';
import { DeleteResult } from 'typeorm/driver/mongodb/typings';

import { UuidParam } from '@/utils';
import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';

import { SourceCreateDto, SourceUpdateDto } from './dto/source.dto';
import { SourceOrmEntity } from './entities/source.entity';
import { SourceService } from './services/source.service';

@Controller('source')
export class SourceController extends BaseOrmController<SourceOrmEntity> {
  constructor(private readonly sourceService: SourceService) {
    super(sourceService);
  }

  @Get()
  async findSources(
    @Query(PopulatePipe)
    populate: string[],
    @Query(
      new TypeOrmSearchFilterPipe<SourceOrmEntity>({
        allowedFields: ['name', 'channel', 'state', 'defaultWorkflow.id'],
        defaultSort: ['createdAt', 'desc'],
      }),
    )
    options: FindManyOptions<SourceOrmEntity>,
  ): Promise<Source[] | SourceFull[]> {
    return await this.find(options, populate);
  }

  @Get('count')
  async filterCount(
    @Query(
      new TypeOrmSearchFilterPipe<SourceOrmEntity>({
        allowedFields: ['name', 'channel', 'state', 'defaultWorkflow.id'],
      }),
    )
    options?: FindManyOptions<SourceOrmEntity>,
  ): Promise<{ count: number }> {
    return await this.count(options ?? {});
  }

  @Get(':id')
  async findSource(
    @UuidParam('id') id: string,
    @Query(PopulatePipe)
    populate: string[],
  ): Promise<Source | SourceFull> {
    return await this.findOne(id, populate);
  }

  @Post()
  async create(@Body() sourceCreateDto: SourceCreateDto): Promise<Source> {
    return await this.sourceService.create(sourceCreateDto);
  }

  @Patch(':id')
  async updateOne(
    @UuidParam('id') id: string,
    @Body() sourceUpdateDto: SourceUpdateDto,
  ) {
    return await this.sourceService.updateOne(id, sourceUpdateDto);
  }

  @Delete(':id')
  async deleteSource(@UuidParam('id') id: string): Promise<DeleteResult> {
    return await this.deleteOne(id);
  }
}
