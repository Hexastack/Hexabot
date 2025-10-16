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

import { ContentType } from '../entities/content-type.entity';
import { Content } from '../entities/content.entity';

@Injectable()
export class ContentTypeRepository extends BaseOrmRepository<ContentType> {
  constructor(
    @InjectRepository(ContentType)
    repository: Repository<ContentType>,
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    private readonly blockService: BlockService,
  ) {
    super(repository);
  }

  protected override async preDelete(
    entities: ContentType[],
    _filter: TFilterQuery<ContentType>,
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
