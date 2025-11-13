/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmRepository } from '@hexabot/core/database';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntitySubscriberInterface, Repository } from 'typeorm';

import {
  ContentType,
  ContentTypeDtoConfig,
  ContentTypeFull,
  ContentTypeTransformerDto,
} from '../dto/contentType.dto';
import { ContentTypeOrmEntity } from '../entities/content-type.entity';

@Injectable()
export class ContentTypeRepository
  extends BaseOrmRepository<
    ContentTypeOrmEntity,
    ContentTypeTransformerDto,
    ContentTypeDtoConfig
  >
  implements EntitySubscriberInterface<ContentTypeOrmEntity>
{
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
