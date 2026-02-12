/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import { LabelDtoConfig } from '../dto/label.dto';
import { LabelOrmEntity } from '../entities/label.entity';

@Injectable()
export class LabelRepository extends BaseOrmRepository<
  LabelOrmEntity,
  LabelDtoConfig
> {
  constructor(
    @InjectRepository(LabelOrmEntity)
    repository: Repository<LabelOrmEntity>,
  ) {
    super(repository, ['users', 'group']);
  }
}
