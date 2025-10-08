/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';

import { Translation } from '../../i18n/schemas/translation.schema';

@Injectable()
export class TranslationRepository extends BaseRepository<Translation> {
  constructor(
    @InjectModel(Translation.name) readonly model: Model<Translation>,
  ) {
    super(model, Translation);
  }
}
