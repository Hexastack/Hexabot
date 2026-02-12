/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import { LabelGroupDtoConfig } from '../dto/label-group.dto';
import { LabelGroupOrmEntity } from '../entities/label-group.entity';

@Injectable()
export class LabelGroupRepository extends BaseOrmRepository<
  LabelGroupOrmEntity,
  LabelGroupDtoConfig
> {
  constructor(
    @InjectRepository(LabelGroupOrmEntity)
    repository: Repository<LabelGroupOrmEntity>,
  ) {
    super(repository, ['labels']);
  }
}
