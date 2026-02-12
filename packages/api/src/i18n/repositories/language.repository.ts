/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import { LanguageDtoConfig } from '../dto/language.dto';
import { LanguageOrmEntity } from '../entities/language.entity';

@Injectable()
export class LanguageRepository extends BaseOrmRepository<
  LanguageOrmEntity,
  LanguageDtoConfig
> {
  constructor(
    @InjectRepository(LanguageOrmEntity)
    repository: Repository<LanguageOrmEntity>,
  ) {
    super(repository, []);
  }
}
