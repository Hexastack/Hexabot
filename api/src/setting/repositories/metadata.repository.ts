/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';

import { Metadata } from '../schemas/metadata.schema';

@Injectable()
export class MetadataRepository extends BaseRepository<Metadata> {
  constructor(@InjectModel(Metadata.name) readonly model: Model<Metadata>) {
    super(model, Metadata);
  }
}
