/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { FindManyOptions } from 'typeorm';

import { PopulatePipe } from '@/utils';
import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { DeleteResult } from '@/utils/generics/base-orm.repository';
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';

import {
  Credential,
  CredentialCreateDto,
  CredentialDtoConfig,
  CredentialFull,
  CredentialUpdateDto,
} from '../dto/credential.dto';
import { CredentialOrmEntity } from '../entities/credential.entity';
import { CredentialService } from '../services/credential.service';

@Controller('credential')
export class CredentialController extends BaseOrmController<
  CredentialOrmEntity,
  CredentialDtoConfig
> {
  constructor(private readonly credentialService: CredentialService) {
    super(credentialService);
  }

  @Post()
  async create(
    @Body() credentialDto: CredentialCreateDto,
    @Req() req: Request,
  ): Promise<Credential> {
    if (!req.session.passport?.user?.id) {
      throw new UnauthorizedException(
        'Only authenticated users are allowed to use this channel',
      );
    }

    return await this.credentialService.create({
      ...credentialDto,
      owner: req.session.passport.user.id,
    });
  }

  @Get()
  async find(
    @Query(PopulatePipe)
    populate: string[],
    @Query(
      new TypeOrmSearchFilterPipe<CredentialOrmEntity>({
        allowedFields: ['name', 'value', 'owner.id'],
        defaultSort: ['createdAt', 'desc'],
      }),
    )
    options: FindManyOptions<CredentialOrmEntity> = {},
  ): Promise<Credential[] | CredentialFull[]> {
    const shouldPopulate = this.canPopulate(populate);

    return shouldPopulate
      ? await this.credentialService.findAndPopulate(options)
      : await this.credentialService.find(options);
  }

  @Get('count')
  async filterCount(
    @Query(
      new TypeOrmSearchFilterPipe<CredentialOrmEntity>({
        allowedFields: ['name', 'value', 'owner.id'],
      }),
    )
    options?: FindManyOptions<CredentialOrmEntity>,
  ) {
    return await this.count(options ?? {});
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query(PopulatePipe)
    populate: string[],
  ): Promise<Credential | CredentialFull> {
    const shouldPopulate = this.canPopulate(populate);
    const record = shouldPopulate
      ? await this.credentialService.findOneAndPopulate(id)
      : await this.credentialService.findOne(id);

    if (!record) {
      this.logger.warn(`Unable to find Credential by id ${id}`);
      throw new NotFoundException(`Credential with ID ${id} not found`);
    }

    return record;
  }

  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() credentialUpdate: CredentialUpdateDto,
  ): Promise<Credential> {
    const record = await this.credentialService.findOne(id);
    if (!record) {
      this.logger.warn(`Unable to update Credential by id ${id}`);
      throw new NotFoundException(`Credential with ID ${id} not found`);
    }

    return await this.credentialService.updateOne(id, credentialUpdate);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteOne(@Param('id') id: string): Promise<DeleteResult> {
    const result = await this.credentialService.deleteOne(id);
    if (result.deletedCount === 0) {
      this.logger.warn(`Unable to delete Credential by id ${id}`);
      throw new NotFoundException(`Credential with ID ${id} not found`);
    }

    return result;
  }
}
