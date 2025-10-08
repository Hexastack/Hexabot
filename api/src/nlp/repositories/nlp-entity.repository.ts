/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';

import { NlpEntityDto } from '../dto/nlp-entity.dto';
import {
  NLP_ENTITY_POPULATE,
  NlpEntity,
  NlpEntityFull,
  NlpEntityPopulate,
} from '../schemas/nlp-entity.schema';

@Injectable()
export class NlpEntityRepository extends BaseRepository<
  NlpEntity,
  NlpEntityPopulate,
  NlpEntityFull,
  NlpEntityDto
> {
  constructor(@InjectModel(NlpEntity.name) readonly model: Model<NlpEntity>) {
    super(model, NlpEntity, NLP_ENTITY_POPULATE, NlpEntityFull);
  }
}
