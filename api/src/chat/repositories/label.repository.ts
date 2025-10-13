/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';

import { LabelDto } from '../dto/label.dto';
import {
  Label,
  LABEL_POPULATE,
  LabelFull,
  LabelPopulate,
} from '../schemas/label.schema';

@Injectable()
export class LabelRepository extends BaseRepository<
  Label,
  LabelPopulate,
  LabelFull,
  LabelDto
> {
  constructor(@InjectModel(Label.name) readonly model: Model<Label>) {
    super(model, Label, LABEL_POPULATE, LabelFull);
  }
}
