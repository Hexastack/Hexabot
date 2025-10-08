/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Injectable } from '@nestjs/common';

import { BaseService } from '@/utils/generics/base-service';

import { LabelGroupDto } from '../dto/label-group.dto';
import { LabelGroupRepository } from '../repositories/label-group.repository';
import { LabelGroup } from '../schemas/label-group.schema';

@Injectable()
export class LabelGroupService extends BaseService<
  LabelGroup,
  never,
  never,
  LabelGroupDto
> {
  constructor(readonly repository: LabelGroupRepository) {
    super(repository);
  }
}
