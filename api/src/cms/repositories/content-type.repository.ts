/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
