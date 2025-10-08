/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';

import { Dummy } from '../schemas/dummy.schema';

@Injectable()
export class DummyRepository extends BaseRepository<Dummy> {
  constructor(@InjectModel(Dummy.name) readonly model: Model<Dummy>) {
    super(model, Dummy);
  }
}
