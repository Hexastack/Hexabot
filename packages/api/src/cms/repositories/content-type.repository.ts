/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
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
    @InjectRepository(ContentTypeOrmEntity)
    repository: Repository<ContentTypeOrmEntity>,
    private readonly blockService: BlockService,
  ) {
    super(repository, [], {
      PlainCls: ContentType,
      FullCls: ContentTypeFull,
    });
  }

  listenTo() {
    return ContentTypeOrmEntity;
  }

  protected override async preDelete(
    entities: ContentTypeOrmEntity[],
    _filter: unknown,
  ): Promise<void> {
    await this.ensureContentTypeHasNoAssociatedBlocks(
      entities.map((entity) => entity.id),
    );
  }

  async beforeRemove(event: RemoveEvent<ContentTypeOrmEntity>): Promise<void> {
    const identifiers: string[] = [];

    if (event.entity) {
      identifiers.push(event.entity.id);
    } else if (event.entityId) {
      const entityId = event.entityId;

      if (typeof entityId === 'string') {
        identifiers.push(entityId);
      } else if (
        typeof entityId === 'object' &&
        entityId !== null &&
        'id' in entityId
      ) {
        const value = (entityId as Record<string, unknown>).id;
        if (typeof value === 'string') {
          identifiers.push(value);
        }
      }
    }

    await this.ensureContentTypeHasNoAssociatedBlocks(identifiers);
  }

  private async ensureContentTypeHasNoAssociatedBlocks(
    contentTypeIds: readonly string[],
  ): Promise<void> {
    const uniqueContentTypeIds = Array.from(new Set(contentTypeIds));

    for (const contentTypeId of uniqueContentTypeIds) {
      if (!contentTypeId) continue;

      const associatedBlock = await this.blockService.findOne({
        'options.content.entity': contentTypeId,
      });

      if (associatedBlock) {
        throw new ForbiddenException(
          'Content type have blocks associated to it',
        );
      }
    }
  }
}
