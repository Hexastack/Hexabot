/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import {
  ContentType,
  ContentTypeDtoConfig,
  ContentTypeFull,
  ContentTypeTransformerDto,
} from '../dto/contentType.dto';
import { ContentTypeOrmEntity } from '../entities/content-type.entity';

@Injectable()
export class ContentTypeRepository extends BaseOrmRepository<
  ContentTypeOrmEntity,
  ContentTypeTransformerDto,
  ContentTypeDtoConfig
> {
  constructor(
    @InjectRepository(ContentTypeOrmEntity)
    repository: Repository<ContentTypeOrmEntity>,
  ) {
    super(repository, [], {
      PlainCls: ContentType,
      FullCls: ContentTypeFull,
    });
  }
}
