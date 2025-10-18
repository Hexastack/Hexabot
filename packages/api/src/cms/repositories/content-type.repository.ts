/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { BlockService } from '@/chat/services/block.service';
import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';
import { TFilterQuery } from '@/utils/types/filter.types';

import {
  ContentType,
  ContentTypeDtoConfig,
  ContentTypeFull,
  ContentTypeTransformerDto,
} from '../dto/contentType.dto';
import { ContentTypeOrmEntity } from '../entities/content-type.entity';
import { ContentOrmEntity } from '../entities/content.entity';

@Injectable()
export class ContentTypeRepository extends BaseOrmRepository<
  ContentTypeOrmEntity,
  ContentTypeTransformerDto,
  ContentTypeDtoConfig
> {
  constructor(
    @InjectRepository(ContentTypeOrmEntity)
    repository: Repository<ContentTypeOrmEntity>,
    @InjectRepository(ContentOrmEntity)
    private readonly contentRepository: Repository<ContentOrmEntity>,
    private readonly blockService: BlockService,
  ) {
    super(repository, [], {
      PlainCls: ContentType,
      FullCls: ContentTypeFull,
    });
  }

  protected override async preDelete(
    entities: ContentTypeOrmEntity[],
    _filter: TFilterQuery<ContentTypeOrmEntity>,
  ): Promise<void> {
    for (const entity of entities) {
      const associatedBlock = await this.blockService.findOne({
        'options.content.entity': entity.id,
      });

      if (associatedBlock) {
        throw new ForbiddenException(
          'Content type have blocks associated to it',
        );
      }
    }

    if (entities.length > 0) {
      const ids = entities.map((entity) => entity.id);
      await this.contentRepository.delete({ entity: In(ids) });
    }
  }
}
