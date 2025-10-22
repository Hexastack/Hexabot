/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  RemoveEvent,
  Repository,
} from 'typeorm';

import { BlockService } from '@/chat/services/block.service';
import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import {
  ContentType,
  ContentTypeDtoConfig,
  ContentTypeFull,
  ContentTypeTransformerDto,
} from '../dto/contentType.dto';
import { ContentTypeOrmEntity } from '../entities/content-type.entity';

@EventSubscriber()
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
    dataSource: DataSource,
    @InjectRepository(ContentTypeOrmEntity)
    repository: Repository<ContentTypeOrmEntity>,
    private readonly blockService: BlockService,
  ) {
    super(repository, [], {
      PlainCls: ContentType,
      FullCls: ContentTypeFull,
    });
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return ContentTypeOrmEntity;
  }

  async beforeRemove(event: RemoveEvent<ContentTypeOrmEntity>): Promise<void> {
    const contentTypeId = event.entityId;

    if (!contentTypeId) {
      return;
    }

    await this.ensureContentTypeHasNoAssociatedBlocks(contentTypeId);
  }

  private async ensureContentTypeHasNoAssociatedBlocks(
    contentTypeId: string,
  ): Promise<void> {
    const associatedBlock = await this.blockService.findOne({
      'options.content.entity': contentTypeId,
    });

    if (associatedBlock) {
      throw new ForbiddenException('Content type have blocks associated to it');
    }
  }
}
