/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
