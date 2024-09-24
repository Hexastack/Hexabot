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
import { Document, Model, Query, TFilterQuery } from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';

import { Language } from '../schemas/language.schema';

@Injectable()
export class LanguageRepository extends BaseRepository<Language> {
  constructor(
    @InjectModel(Language.name) readonly model: Model<Language>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(model, Language);
  }

  /**
   * Pre-delete hook that triggers before an language is deleted.
   *
   * @param query The query used to delete the language.
   * @param criteria The filter criteria used to find the language for deletion.
   */
  async preDelete(
    _query: Query<
      DeleteResult,
      Document<Language, any, any>,
      unknown,
      Language,
      'deleteOne' | 'deleteMany'
    >,
    criteria: TFilterQuery<Language>,
  ): Promise<void> {
    if (criteria._id) {
      const language = await this.findOne(
        typeof criteria === 'string' ? { _id: criteria } : criteria,
      );
      this.eventEmitter.emit('hook:language:delete', language);
    } else {
      throw new Error('Attempted to delete language using unknown criteria');
    }
  }
}
