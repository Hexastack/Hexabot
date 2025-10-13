/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';

import { Attachment } from '../schemas/attachment.schema';

@Injectable()
export class AttachmentRepository extends BaseRepository<Attachment, never> {
  constructor(@InjectModel(Attachment.name) readonly model: Model<Attachment>) {
    super(model, Attachment);
  }
}
