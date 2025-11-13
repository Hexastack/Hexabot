/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmRepository } from '@hexabot/core/database';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  LabelGroup,
  LabelGroupDtoConfig,
  LabelGroupFull,
  LabelGroupTransformerDto,
} from '../dto/label-group.dto';
import { LabelGroupOrmEntity } from '../entities/label-group.entity';

@Injectable()
export class LabelGroupRepository extends BaseOrmRepository<
  LabelGroupOrmEntity,
  LabelGroupTransformerDto,
  LabelGroupDtoConfig
> {
  constructor(
    @InjectRepository(LabelGroupOrmEntity)
    repository: Repository<LabelGroupOrmEntity>,
  ) {
    super(repository, ['labels'], {
      PlainCls: LabelGroup,
      FullCls: LabelGroupFull,
    });
  }
}
