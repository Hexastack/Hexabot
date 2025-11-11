/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import {
  NlpEntity,
  NlpEntityDtoConfig,
  NlpEntityFull,
  NlpEntityTransformerDto,
} from '../dto/nlp-entity.dto';
import { NlpEntityOrmEntity } from '../entities/nlp-entity.entity';

@Injectable()
export class NlpEntityRepository extends BaseOrmRepository<
  NlpEntityOrmEntity,
  NlpEntityTransformerDto,
  NlpEntityDtoConfig
> {
  constructor(
    @InjectRepository(NlpEntityOrmEntity)
    repository: Repository<NlpEntityOrmEntity>,
  ) {
    super(repository, ['values'], {
      PlainCls: NlpEntity,
      FullCls: NlpEntityFull,
    });
  }
}
