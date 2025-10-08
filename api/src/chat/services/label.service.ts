/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Injectable } from '@nestjs/common';

import { BaseService } from '@/utils/generics/base-service';

import { LabelDto } from '../dto/label.dto';
import { LabelRepository } from '../repositories/label.repository';
import { Label, LabelFull, LabelPopulate } from '../schemas/label.schema';

@Injectable()
export class LabelService extends BaseService<
  Label,
  LabelPopulate,
  LabelFull,
  LabelDto
> {
  constructor(readonly repository: LabelRepository) {
    super(repository);
  }
}
