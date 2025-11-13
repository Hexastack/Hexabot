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
  Language,
  LanguageDtoConfig,
  LanguageTransformerDto,
} from '../dto/language.dto';
import { LanguageOrmEntity } from '../entities/language.entity';

@Injectable()
export class LanguageRepository extends BaseOrmRepository<
  LanguageOrmEntity,
  LanguageTransformerDto,
  LanguageDtoConfig
> {
  constructor(
    @InjectRepository(LanguageOrmEntity)
    repository: Repository<LanguageOrmEntity>,
  ) {
    super(repository, [], {
      PlainCls: Language,
      FullCls: Language,
    });
  }
}
