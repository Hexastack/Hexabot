/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmSeeder } from '@/utils/generics/base-orm.seeder';

import { NlpEntityDto } from '../dto/nlp-entity.dto';
import { NlpEntityOrmEntity } from '../entities/nlp-entity.entity';
import { NlpEntityRepository } from '../repositories/nlp-entity.repository';

@Injectable()
export class NlpEntitySeeder extends BaseOrmSeeder<NlpEntityOrmEntity> {
  constructor(nlpEntityRepository: NlpEntityRepository) {
    super(nlpEntityRepository);
  }
}
