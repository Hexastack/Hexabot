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
  NlpSampleEntity,
  NlpSampleEntityDto,
  NlpSampleEntityFull,
  NlpSampleEntityTransformerDto,
} from '../dto/nlp-sample-entity.dto';
import { NlpSampleEntityOrmEntity } from '../entities/nlp-sample-entity.entity';

@Injectable()
export class NlpSampleEntityRepository extends BaseOrmRepository<
  NlpSampleEntityOrmEntity,
  NlpSampleEntityTransformerDto,
  NlpSampleEntityDto
> {
  constructor(
    @InjectRepository(NlpSampleEntityOrmEntity)
    repository: Repository<NlpSampleEntityOrmEntity>,
  ) {
    super(repository, ['entity', 'value', 'sample'], {
      PlainCls: NlpSampleEntity,
      FullCls: NlpSampleEntityFull,
    });
  }
}
