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
  Label,
  LabelDtoConfig,
  LabelFull,
  LabelTransformerDto,
} from '../dto/label.dto';
import { LabelOrmEntity } from '../entities/label.entity';

@Injectable()
export class LabelRepository extends BaseOrmRepository<
  LabelOrmEntity,
  LabelTransformerDto,
  LabelDtoConfig
> {
  constructor(
    @InjectRepository(LabelOrmEntity)
    repository: Repository<LabelOrmEntity>,
  ) {
    super(repository, ['users', 'group'], {
      PlainCls: Label,
      FullCls: LabelFull,
    });
  }
}
