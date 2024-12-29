/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ProjectionType, Query } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';
import {
  PageQueryDto,
  QuerySortDto,
} from '@/utils/pagination/pagination-query.dto';
import { TFilterQuery } from '@/utils/types/filter.types';

import {
  Attachment,
  ATTACHMENT_POPULATE,
  AttachmentPopulate,
  UserAttachmentFull,
} from '../schemas/attachment.schema';

@Injectable()
export class UserAttachmentRepository extends BaseRepository<
  Attachment,
  AttachmentPopulate,
  UserAttachmentFull
> {
  constructor(
    readonly eventEmitter: EventEmitter2,
    @InjectModel(Attachment.name) readonly model: Model<Attachment>,
  ) {
    super(
      eventEmitter,
      model,
      Attachment,
      ATTACHMENT_POPULATE,
      UserAttachmentFull,
    );
  }

  protected findQuery(
    filter: TFilterQuery<Attachment>,
    pageQuery?: QuerySortDto<Attachment> | PageQueryDto<Attachment>,
    projection?: ProjectionType<Attachment>,
  ): Query<Attachment[], Attachment, object, Attachment, 'find', object> {
    return super.findQuery(
      { ...filter, ownerType: 'User' },
      pageQuery as PageQueryDto<Attachment>,
      projection,
    );
  }
}
