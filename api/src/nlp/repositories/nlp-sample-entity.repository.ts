/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';

import {
  NLP_SAMPLE_ENTITY_POPULATE,
  NlpSampleEntity,
  NlpSampleEntityFull,
  NlpSampleEntityPopulate,
} from '../schemas/nlp-sample-entity.schema';

@Injectable()
export class NlpSampleEntityRepository extends BaseRepository<
  NlpSampleEntity,
  NlpSampleEntityPopulate,
  NlpSampleEntityFull
> {
  constructor(
    @InjectModel(NlpSampleEntity.name) readonly model: Model<NlpSampleEntity>,
  ) {
    super(
      model,
      NlpSampleEntity,
      NLP_SAMPLE_ENTITY_POPULATE,
      NlpSampleEntityFull,
    );
  }
}
