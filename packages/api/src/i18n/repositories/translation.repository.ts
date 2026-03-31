/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import { TranslationOrmEntity } from '../entities/translation.entity';

@Injectable()
export class TranslationRepository extends BaseOrmRepository<TranslationOrmEntity> {
  constructor(
    @InjectRepository(TranslationOrmEntity)
    repository: Repository<TranslationOrmEntity>,
  ) {
    super(repository, []);
  }
}
