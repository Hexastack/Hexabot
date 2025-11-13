/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmRepository } from '@hexabot/core/database';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Translation,
  TranslationDtoConfig,
  TranslationTransformerDto,
} from '../dto/translation.dto';
import { TranslationOrmEntity } from '../entities/translation.entity';

@Injectable()
export class TranslationRepository extends BaseOrmRepository<
  TranslationOrmEntity,
  TranslationTransformerDto,
  TranslationDtoConfig
> {
  constructor(
    @InjectRepository(TranslationOrmEntity)
    repository: Repository<TranslationOrmEntity>,
  ) {
    super(repository, [], {
      PlainCls: Translation,
      FullCls: Translation,
    });
  }
}
