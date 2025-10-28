/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmService } from '@/utils/generics/base-orm.service';

import {
  LabelGroupDtoConfig,
  LabelGroupTransformerDto,
} from '../dto/label-group.dto';
import { LabelGroupOrmEntity } from '../entities/label-group.entity';
import { LabelGroupRepository } from '../repositories/label-group.repository';

@Injectable()
export class LabelGroupService extends BaseOrmService<
  LabelGroupOrmEntity,
  LabelGroupTransformerDto,
  LabelGroupDtoConfig
> {
  constructor(readonly repository: LabelGroupRepository) {
    super(repository);
  }
}
