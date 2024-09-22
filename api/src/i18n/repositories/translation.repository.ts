/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Query, Types } from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';

import { Translation } from '../../i18n/schemas/translation.schema';

@Injectable()
export class TranslationRepository extends BaseRepository<Translation> {
  constructor(
    @InjectModel(Translation.name) readonly model: Model<Translation>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(model, Translation);
  }

  /**
   * Emits an event after a translation document is updated.
   *
   * @param query - The query object representing the update operation.
   * @param updated - The updated translation document.
   */
  async postUpdate(
    _query: Query<
      Document<Translation, any, any>,
      Document<Translation, any, any>,
      unknown,
      Translation,
      'findOneAndUpdate'
    >,
    _updated: Translation,
  ) {
    this.eventEmitter.emit('hook:translation:update');
  }

  /**
   * Emits an event after a new translation document is created.
   *
   * @param created - The newly created translation document.
   */
  async postCreate(
    _created: Document<unknown, unknown, Translation> &
      Translation & { _id: Types.ObjectId },
  ) {
    this.eventEmitter.emit('hook:translation:create');
  }

  /**
   * Emits an event after a translation document is deleted.
   *
   * @param query - The query object representing the delete operation.
   * @param result - The result of the delete operation.
   */
  async postDelete(
    _query: Query<
      DeleteResult,
      Document<Translation, any, any>,
      unknown,
      Translation,
      'deleteOne' | 'deleteMany'
    >,
    _result: DeleteResult,
  ) {
    this.eventEmitter.emit('hook:translation:delete');
  }
}
