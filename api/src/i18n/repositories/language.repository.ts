/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Query } from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';
import { TFilterQuery } from '@/utils/types/filter.types';

import { LanguageDto } from '../dto/language.dto';
import { Language } from '../schemas/language.schema';

@Injectable()
export class LanguageRepository extends BaseRepository<
  Language,
  never,
  never,
  LanguageDto
> {
  constructor(@InjectModel(Language.name) readonly model: Model<Language>) {
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
    _criteria: TFilterQuery<Language>,
  ): Promise<void> {
    if (_criteria._id) {
      const language = await this.find(
        typeof _criteria === 'string' ? { _id: _criteria } : _criteria,
      );
      this.eventEmitter.emit('hook:language:delete', language);
    } else {
      throw new Error('Attempted to delete language using unknown criteria');
    }
  }
}
