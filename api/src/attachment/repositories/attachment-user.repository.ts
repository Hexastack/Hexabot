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
import { Model, Query } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';
import { QuerySortDto } from '@/utils/pagination/pagination-query.dto';

import {
  Attachment,
  ATTACHMENT_POPULATE,
  AttachmentPopulate,
  AttachmentUserFull,
} from '../schemas/attachment.schema';

@Injectable()
export class AttachmentUserRepository extends BaseRepository<
  Attachment,
  AttachmentPopulate,
  AttachmentUserFull
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
      AttachmentUserFull,
    );
  }

  /**
   * @deprecated - This method is not allowed
   */
  protected findAllQuery(
    _sort?: QuerySortDto<Attachment>,
  ): Query<Attachment[], Attachment, object, Attachment, 'find', object> {
    throw new Error('findAllQuery method is not allowed');
  }

  /**
   * @deprecated - This method is not allowed
   */
  async findAll(_sort?: QuerySortDto<Attachment>): Promise<Attachment[]> {
    throw new Error('findAll method is not allowed');
  }

  /**
   * @deprecated - This method is not allowed
   */
  async findAllAndPopulate(
    _sort?: QuerySortDto<Attachment>,
  ): Promise<AttachmentUserFull[]> {
    throw new Error('findAllAndPopulate method is not allowed');
  }
}
