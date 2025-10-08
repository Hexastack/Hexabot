/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Query } from 'mongoose';

import { BlockService } from '@/chat/services/block.service';
import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';
import { TFilterQuery } from '@/utils/types/filter.types';

import { ContentTypeDto } from '../dto/contentType.dto';
import { ContentType } from '../schemas/content-type.schema';
import { Content } from '../schemas/content.schema';

@Injectable()
export class ContentTypeRepository extends BaseRepository<
  ContentType,
  never,
  never,
  ContentTypeDto
> {
  constructor(
    @InjectModel(ContentType.name) readonly model: Model<ContentType>,
    @InjectModel(Content.name) private readonly contentModel: Model<Content>,
    private readonly blockService: BlockService,
  ) {
    super(model, ContentType);
  }

  /**
   * This method is triggered before deleting a content type entity.
   * It checks if there are any associated blocks linked to the content type entity,
   * and if found, it throws a `ForbiddenException` to prevent deletion.
   * If no blocks are associated, it deletes all related content records linked to the content type entity.
   *
   * @param query - The query object used for deletion.
   * @param criteria - The filter query to identify the content type entity to delete.
   */
  async preDelete(
    _query: Query<
      DeleteResult,
      Document<ContentType, any, any>,
      unknown,
      ContentType,
      'deleteOne' | 'deleteMany'
    >,
    criteria: TFilterQuery<ContentType>,
  ) {
    if (criteria._id) {
      const associatedBlock = await this.blockService.findOne({
        'options.content.entity': criteria._id,
      });
      if (associatedBlock) {
        throw new ForbiddenException(
          'Content type have blocks associated to it',
        );
      }
      await this.contentModel.deleteMany({ entity: criteria._id });
    } else {
      throw new Error(
        'Attempted to delete content type using unknown criteria',
      );
    }
  }
}
