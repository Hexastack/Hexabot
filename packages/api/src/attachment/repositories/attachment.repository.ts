/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmRepository } from '@hexabot/core/database';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';

import {
  Attachment,
  AttachmentDtoConfig,
  AttachmentFull,
  AttachmentTransformerDto,
} from '../dto/attachment.dto';

@Injectable()
export class AttachmentRepository extends BaseOrmRepository<
  AttachmentOrmEntity,
  AttachmentTransformerDto,
  AttachmentDtoConfig
> {
  constructor(
    @InjectRepository(AttachmentOrmEntity)
    repository: Repository<AttachmentOrmEntity>,
  ) {
    super(repository, ['createdBy'], {
      PlainCls: Attachment,
      FullCls: AttachmentFull,
    });
  }
}
