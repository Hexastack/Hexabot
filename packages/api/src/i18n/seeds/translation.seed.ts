/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmSeeder } from '@/utils/generics/base-orm.seeder';

import { Translation } from '../entities/translation.entity';
import { TranslationRepository } from '../repositories/translation.repository';

@Injectable()
export class TranslationSeeder extends BaseOrmSeeder<
  Translation,
  TranslationRepository
> {
  constructor(translationRepository: TranslationRepository) {
    super(translationRepository);
  }
}
